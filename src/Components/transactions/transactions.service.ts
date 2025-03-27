import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import {
  CreateTransactionDto,
  InitializeTransactionDto,
} from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { InjectModel } from '@nestjs/sequelize';
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
import { ConfigService } from '@nestjs/config';
import axios, { AxiosResponse } from 'axios';
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
import { createHmac, timingSafeEqual } from 'crypto';
import { uuidv7 } from 'uuidv7';
import { EmailService, Utils } from '../utils';
import {
  CoingateInitTransactionDto,
  CoingateInitTransactionResponseDto,
} from './dto/coingate.dto';
import { RegistrationStatus } from '../registrations/types';
import { Registration } from '../registrations/entities/registration.entity';
import { eventRegistrationEmail } from '../utils/templates/event-registration';
import { Sequelize } from 'sequelize-typescript';
import { Request } from 'express';

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
  ) {}

  async initializePaystackTransaction(
    dto: InitializeTransactionDto,
  ): Promise<TransactionResponse> {
    const { eventId, fullName, email, phoneNumber } = dto;

    const event = await this.eventModel.findOne({ where: { id: eventId } });
    if (!event)
      throw new NotFoundException(
        'Event Not Found',
        `No event found with id: ${eventId}`,
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
      ],
    };

    const paystackTransaction: PaystackCreateTransactionDto = {
      email,
      amount: event.dataValues.amount * 100,
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
        amount: event.dataValues.amount,
        currency: event.dataValues.currency,
        transactionReference: Utils.generateTrxReference(),
        type: TransactionType.CARD,
        gatewayReference: data.reference,
        paymentLink: data.authorization_url,
      };

      if (result.status === true) {
        await this.trxModel.create({ id: transactionId, ...transaction });
      }

      return {
        success: true,
        statusCode: HttpStatus.CREATED,
        message: 'Transaction in progress',
        data: { id: transactionId, ...transaction },
      };
    } catch (error) {
      throw error;
    }
  }

  async verifyPaystackTransaction(dto: PaystackCallbackDto, req?: Request) {
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
      if (!response) return null;

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

      return {
        success: true,
        statusCode: HttpStatus.OK,
        message:
          'Transaction Verification in Progress.  Check your email for your access code.',
        data: updatedTrx,
      };
    } catch (error) {
      throw error;
    }
  }

  async handlePaystackWebhook(
    dto: PaystackWebhookDto,
    signature: string,
    req?: Request,
  ) {
    if (!dto.data) return false;

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

      if (!signature || signature.length !== hash.length) return false;
      isValidEvent =
        hash &&
        signature &&
        timingSafeEqual(Buffer.from(hash), Buffer.from(signature));

      if (!isValidEvent) {
        return false;
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

      const updatedTrx = this.updateTransactionStatus(
        dto.data.reference!,
        paymentConfirmed,
        gatewayStatus,
      );
      if (paymentConfirmed) {
        await this.completeRegistration(dto.data.reference!, req);
      }

      return {
        success: true,
        statusCode: HttpStatus.OK,
        message:
          'Transaction Verification in Progress. Check your email for your access code.',
        data: updatedTrx,
      };
    } catch (error) {
      throw error;
    }
  }

  async initializeCoingateTransaction(dto: InitializeTransactionDto) {
    const { eventId, fullName, email, phoneNumber } = dto;
    const event = await this.eventModel.findOne({ where: { id: eventId } });
    if (!event)
      throw new NotFoundException(
        'Event Not Found',
        `No event found with id: ${eventId}`,
      );

    const trxRef = Utils.generateTrxReference();
    const token = trxRef.slice(5);

    const coingateTransaction: CoingateInitTransactionDto = {
      order_id: trxRef,
      price_amount: event.dataValues.cryptoAmount,
      price_currency: event.dataValues.cryptoSymbol,
      receive_currency: event.dataValues.cryptoSymbol,
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
        amount: event.dataValues.cryptoAmount,
        currency: event.dataValues.cryptoSymbol,
        transactionReference: trxRef,
        type: TransactionType.CRYPTO,
        gatewayReference: token,
        paymentLink: response.data.payment_url,
      };

      await this.trxModel.create({ id: transactionId, ...transaction });

      return {
        success: true,
        statusCode: HttpStatus.CREATED,
        message: 'Transaction in progress',
        data: { id: transactionId, ...transaction },
      };
    } catch (error) {
      throw error;
    }
  }

  async verifyCoingateTransaction(req, body) {
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

      return {
        success: true,
        statusCode: HttpStatus.OK,
        message:
          'Transaction Verification in Progress. Check your email for your access code.',
        data: updatedTrx,
      };
    } catch (error) {
      throw error;
    }
  }

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
      );
      if (!event) {
        await t.rollback();
        return;
      }

      await this.eventModel.update(
        {
          registered: Sequelize.literal('registered + 1'),
          totalAmount: Sequelize.literal(
            `"totalAmount" + ${event.dataValues.amount}`,
          ),
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
    const baseUrl =
      req?.headers.origin ||
      process.env.FFRONTEND_BASE_URL ||
      'https://ticxpress.com';

    const eventUrl = `${baseUrl}/${event.dataValues.name.replace(/\s+/g, '').toLowerCase()}/dashboard`;
    const emailContent = eventRegistrationEmail(
      event.dataValues.id,
      event.dataValues.name,
      event.dataValues.time,
      event.dataValues.location,
      event.dataValues.description,
      registration.dataValues.fullName,
      registration.dataValues.accessCode,
      eventUrl,
    );

    const emailResponse = await this.emailService.sendEmail(
      registration.dataValues.email,
      `Registration successful for ${event.dataValues.name}`,
      emailContent,
    );

    if (!emailResponse.success) {
      throw new InternalServerException(
        'Email Error',
        'Error while sending email',
      );
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
