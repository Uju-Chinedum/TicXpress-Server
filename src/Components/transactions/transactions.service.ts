import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosResponse } from 'axios';
import { createHmac, timingSafeEqual } from 'crypto';
import { uuidv7 } from 'uuidv7';
import { Sequelize } from 'sequelize-typescript';
import { Request } from 'express';

import {
  CreateTransactionDto,
  InitializeTransactionDto,
} from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { Transaction } from './entities/transaction.entity';
import {
  PaystackCallbackDto,
  PaystackCreateTransactionDto,
  PaystackCreateTransactionResponseDto,
  PaystackMetadata,
  PaystackVerifyTransactionResponseDto,
  PaystackWebhookDto,
} from './dto/paystack.dto';
import { Event } from '../events/entities/event.entity';
import {
  BadRequestException,
  InternalServerException,
  NotFoundException,
} from '../../common/exceptions';
import {
  COINGATE_INIT_URL,
  PAYSTACK_INIT_URL,
  PAYSTACK_VERIFY_BASE_URL,
  PAYSTACK_WEBHOOK_CRYPTO_ALGO,
} from '../global/constants';
import {
  TransactionResponse,
  TransactionStatus,
  TransactionType,
} from './types';
import {
  eventRegistrationEmail,
  EmailService,
  successResponse,
  Utils,
} from '../../common/utils';
import {
  CoingateInitTransactionDto,
  CoingateInitTransactionResponseDto,
} from './dto/coingate.dto';
import { RegistrationStatus } from '../registrations/types';
import { Registration } from '../registrations/entities/registration.entity';
import { AppResponse } from '../global/types';
import { Ticket } from '../events/entities/ticket.entity';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction)
    private trxModel: typeof Transaction,
    @InjectModel(Event)
    private eventModel: typeof Event,
    private configService: ConfigService,
    @InjectModel(Registration)
    private registerModel: typeof Registration,
    private sequelize: Sequelize,
    private emailService: EmailService,
    @InjectModel(Ticket)
    private ticketModel: typeof Ticket,
  ) {}

  private async updateTransactionStatus(
    reference: string,
    paymentStatus: boolean,
    gatewayStatus?: string,
  ): Promise<Transaction | null> {
    const updateData: { status: TransactionStatus; gatewayStatus?: string } = {
      status: paymentStatus
        ? TransactionStatus.SUCCESS
        : TransactionStatus.FAILED,
    };
    if (gatewayStatus) {
      updateData.gatewayStatus = gatewayStatus;
    }

    const [count] = await this.trxModel.update(updateData, {
      where: { gatewayReference: reference },
    });

    if (count === 0) return null;

    return this.trxModel.findOne({ where: { gatewayReference: reference } });
  }

  private async completeRegistration(reference: string, req?: Request) {
    const transaction = await this.trxModel.findOne({
      where: { gatewayReference: reference },
    });

    if (
      !transaction ||
      !transaction.dataValues.registrationId ||
      transaction.dataValues.registrationCompleted
    ) {
      return;
    }

    const t = await this.sequelize.transaction();

    try {
      await this.trxModel.update(
        { registrationCompleted: true },
        { where: { gatewayReference: reference }, transaction: t },
      );

      const registration = await this.registerModel.findByPk(
        transaction.dataValues.registrationId,
        { transaction: t },
      );

      if (!registration) {
        await t.rollback();
        return;
      }

      await this.registerModel.update(
        {
          accessCode: Utils.generateAccessCode(),
          status: RegistrationStatus.APPROVED,
        },
        { where: { id: registration.id }, transaction: t },
      );

      const event = await this.eventModel.findByPk(
        registration.dataValues.eventId,
        { transaction: t },
      );
      if (!event) {
        await t.rollback();
        return;
      }

      const ticket = await this.ticketModel.findByPk(
        registration.dataValues.ticketId,
        { transaction: t },
      );

      const ticketAmount = ticket?.dataValues?.amount ?? 0;

      if (ticket) {
        await this.ticketModel.update(
          {
            registered: Sequelize.literal('"registered" + 1'),
          },
          {
            where: { id: ticket.id },
            transaction: t,
          },
        );
      }
      
      await this.eventModel.update(
        {
          registered: Sequelize.literal('"registered" + 1'),
          totalAmount: Sequelize.literal(`"totalAmount" + ${ticketAmount}`),
        },
        { where: { id: event.id }, transaction: t },
      );

      await t.commit();

      const updatedRegistration = await this.registerModel.findByPk(
        registration.id,
      );
      await this.sendRegistrationEmail(updatedRegistration, event, req);
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  private async sendRegistrationEmail(registration, event, req?: Request) {
    const eventUrl = Utils.generateEventUrl(event.dataValues.name, { req });
    await Utils.sendSuccessEmail({
      emailService: this.emailService,
      email: registration.dataValues.email,
      subject: `Registration successful for ${event.dataValues.name}`,
      htmlTemplate: eventRegistrationEmail(
        event.dataValues.name,
        event.dataValues.time,
        event.dataValues.location,
        event.dataValues.description,
        registration.dataValues.fullName,
        registration.dataValues.accessCode,
        eventUrl,
      ),
      eventUrl,
    });
  }

  async initializePaystackTransaction(
    dto: InitializeTransactionDto,
  ): Promise<AppResponse<TransactionResponse>> {
    const { eventId, ticketId, fullName, email, phoneNumber } = dto;

    const event = await this.eventModel.findOne({ where: { id: eventId } });
    if (!event)
      throw new NotFoundException(
        'Event Not Found',
        `No event found with id: ${eventId}`,
      );

    const ticket = await this.ticketModel.findOne({
      where: { id: ticketId, eventId },
    });
    if (!ticket)
      throw new NotFoundException(
        'Ticket Not Found',
        `No ticket tier found with id: ${ticketId} for event: ${eventId}`,
      );

    const metadata: PaystackMetadata = {
      eventId,
      custom_fields: [
        {
          display_name: 'Name',
          variable_name: 'name',
          value: fullName,
        },
        {
          display_name: 'Email',
          variable_name: 'email',
          value: email,
        },
        {
          display_name: 'Ticket Tier',
          variable_name: 'ticket_tier',
          value: ticket.dataValues.name,
        },
      ],
    };

    const paystackTransaction: PaystackCreateTransactionDto = {
      email,
      amount: ticket.dataValues.amount * 100,
      metadata,
    };

    const paystackCallbackUrl = this.configService.get('PAYSTACK_CALLBACK_URL');
    if (paystackCallbackUrl)
      paystackTransaction.callback_url = paystackCallbackUrl;

    const payload = JSON.stringify(paystackTransaction);
    let result: PaystackCreateTransactionResponseDto;

    try {
      const response = await axios.post<PaystackCreateTransactionResponseDto>(
        PAYSTACK_INIT_URL,
        payload,
        {
          headers: {
            Authorization: `Bearer ${this.configService.get<string>('PAYSTACK_SECRET_KEY')}`,
            'Content-Type': 'application/json',
          },
        },
      );

      result = response.data;

      const data = result.data;
      const transactionId = uuidv7();
      const transaction: CreateTransactionDto = {
        fullName,
        email,
        phoneNumber,
        eventId,
        amount: ticket.dataValues.amount,
        currency: ticket.dataValues.currency,
        transactionReference: Utils.generateTrxReference(),
        type: TransactionType.CARD,
        gatewayReference: data.reference,
        paymentLink: data.authorization_url,
      };

      if (result.status === true) {
        await this.trxModel.create({ id: transactionId, ...transaction });
      }

      return successResponse(
        'Transaction in progress',
        { id: transactionId, ...transaction },
        HttpStatus.CREATED,
      );
    } catch (error) {
      throw error;
    }
  }

  async verifyPaystackTransaction(
    dto: PaystackCallbackDto,
    req?: Request,
  ): Promise<AppResponse<Transaction | null>> {
    const transaction = await this.trxModel.findOne({
      where: { gatewayReference: dto.reference },
    });
    if (!transaction)
      throw new NotFoundException(
        'Transaction Not Found',
        `No transaction found with reference: ${dto.reference}`,
      );

    const url = `${PAYSTACK_VERIFY_BASE_URL}/${transaction.dataValues.gatewayReference}`;
    let response: AxiosResponse<PaystackVerifyTransactionResponseDto>;

    try {
      response = await axios.get<PaystackVerifyTransactionResponseDto>(url, {
        headers: {
          Authorization: `Bearer ${this.configService.get<string>('PAYSTACK_SECRET_KEY')}`,
        },
      });
      if (!response)
        return successResponse(
          'Transaction verification failed',
          null,
          HttpStatus.BAD_REQUEST,
        );

      const result = response.data;
      const gatewayStatus = result?.data?.status;
      const paymentConfirmed = gatewayStatus === 'success';

      const updatedTrx = await this.updateTransactionStatus(
        dto.reference,
        paymentConfirmed,
        gatewayStatus,
      );
      if (paymentConfirmed) {
        await this.completeRegistration(dto.reference, req);
      }

      return successResponse(
        'Transaction Verification in Progress.  Check your email for your access code.',
        updatedTrx,
      );
    } catch (error) {
      throw error;
    }
  }

  async handlePaystackWebhook(
    dto: PaystackWebhookDto,
    signature: string,
    req?: Request,
  ): Promise<AppResponse<Transaction | null>> {
    if (!dto.data)
      return successResponse(
        'Invalid webhook data received.',
        null,
        HttpStatus.BAD_REQUEST,
      );

    let isValidEvent: string | boolean = false;

    try {
      const secretKey = this.configService.get<string>('PAYSTACK_SECRET_KEY');
      if (!secretKey) {
        throw new BadRequestException(
          'Missing Secret Key',
          'PAYSTACK_SECRET_KEY is not defined in environment variables',
        );
      }

      const hash = createHmac(PAYSTACK_WEBHOOK_CRYPTO_ALGO, secretKey)
        .update(JSON.stringify(dto))
        .digest('hex');

      if (!signature || signature.length !== hash.length)
        return successResponse(
          'Invalid webhook signature.',
          null,
          HttpStatus.BAD_REQUEST,
        );
      isValidEvent =
        hash &&
        signature &&
        timingSafeEqual(Buffer.from(hash), Buffer.from(signature));

      if (!isValidEvent) {
        return successResponse(
          'Webhook signature verification failed.',
          null,
          HttpStatus.UNAUTHORIZED,
        );
      }

      const transaction = await this.trxModel.findOne({
        where: {
          gatewayReference: dto.data.reference,
        },
      });
      if (!transaction)
        throw new NotFoundException(
          'Transaction Not Found',
          `No transaction found with reference: ${dto.data.reference}`,
        );

      const gatewayStatus = dto.data.status;
      const paymentConfirmed = gatewayStatus === 'success';

      const updatedTrx = await this.updateTransactionStatus(
        dto.data.reference!,
        paymentConfirmed,
        gatewayStatus,
      );
      if (paymentConfirmed) {
        await this.completeRegistration(dto.data.reference!, req);
      }

      return successResponse(
        'Transaction Verification in Progress.  Check your email for your access code.',
        updatedTrx,
      );
    } catch (error) {
      throw error;
    }
  }

  async initializeCoingateTransaction(
    dto: InitializeTransactionDto,
  ): Promise<AppResponse<TransactionResponse>> {
    const { eventId, ticketId, fullName, email, phoneNumber } = dto;

    const event = await this.eventModel.findOne({ where: { id: eventId } });
    if (!event)
      throw new NotFoundException(
        'Event Not Found',
        `No event found with id: ${eventId}`,
      );

    const ticket = await this.ticketModel.findOne({
      where: { id: ticketId, eventId },
    });
    if (!ticket)
      throw new NotFoundException(
        'Ticket Not Found',
        `No ticket tier found with id: ${ticketId} for event: ${eventId}`,
      );

    const trxRef = Utils.generateTrxReference();
    const token = trxRef.slice(5);

    const coingateTransaction: CoingateInitTransactionDto = {
      order_id: trxRef,
      price_amount: ticket.dataValues.cryptoAmount,
      price_currency: 'USDC',
      receive_currency: 'USDC',
      title: event.dataValues.name,
      description: event.dataValues.description,
      callback_url: this.configService.get<string>('COINGATE_CALLBACK_URL')!,
      cancel_url: this.configService.get<string>('COINGATE_CANCEL_URL')!,
      success_url: this.configService.get<string>('COINGATE_SUCCESS_URL')!,
      token,
    };

    try {
      const response = await axios.post<CoingateInitTransactionResponseDto>(
        COINGATE_INIT_URL,
        coingateTransaction,
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Token ${this.configService.get<string>('COINGATE_AUTH_TOKEN')}`,
          },
        },
      );

      const transactionId = uuidv7();
      const transaction: CreateTransactionDto = {
        fullName,
        email,
        phoneNumber,
        eventId,
        amount: ticket.dataValues.cryptoAmount,
        currency: 'USDC',
        transactionReference: trxRef,
        type: TransactionType.CRYPTO,
        gatewayReference: token,
        paymentLink: response.data.payment_url,
      };

      await this.trxModel.create({ id: transactionId, ...transaction });

      return successResponse(
        'Transaction in progress',
        { id: transactionId, ...transaction },
        HttpStatus.CREATED,
      );
    } catch (error) {
      throw error;
    }
  }

  async verifyCoingateTransaction(
    req,
    body,
  ): Promise<AppResponse<Transaction | null>> {
    const { status, order_id, token } = body;

    try {
      const transaction = await this.trxModel.findOne({
        where: { transactionReference: order_id },
      });
      if (!transaction)
        throw new NotFoundException(
          'Transaction Not Found',
          `No transaction found with reference: ${order_id}`,
        );

      const paymentConfirmed = status === 'paid';

      const updatedTrx = await this.updateTransactionStatus(
        token,
        paymentConfirmed,
      );
      if (paymentConfirmed) {
        await this.completeRegistration(token, req);
      }

      return successResponse(
        'Transaction Verification in Progress. Check your email for your access code.',
        updatedTrx,
      );
    } catch (error) {
      throw error;
    }
  }

  async findAll() {
    return `This action returns all transactions`;
  }

  async findOne(id: number) {
    return `This action returns a #${id} transaction`;
  }

  async update(id: number, updateTransactionDto: UpdateTransactionDto) {
    return `This action updates a #${id} transaction`;
  }

  async remove(id: number) {
    return `This action removes a #${id} transaction`;
  }
}
