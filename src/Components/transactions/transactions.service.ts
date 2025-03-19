import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { InjectModel } from '@nestjs/sequelize';
import { Transaction } from './entities/transaction.entity';
import {
  InitializeTransactionDto,
  PaystackCallbackDto,
  PaystackCreateTransactionDto,
  PaystackCreateTransactionResponseDto,
  PaystackMetadata,
  PaystackVerifyTransactionResponseDto,
  PaystackWebhookDto,
} from './dto/paystack.dto';
import { Event } from '../events/entities/event.entity';
import { NotFoundException } from '../../common/exceptions';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosResponse } from 'axios';
import {
  PAYSTACK_INIT_URL,
  PAYSTACK_VERIFY_BASE_URL,
  PAYSTACK_WEBHOOK_CRYPTO_ALGO,
} from '../global/constants';
import { TransactionStatus } from './types';
import { createHmac, KeyObject, timingSafeEqual } from 'crypto';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction)
    private trxModel: typeof Transaction,
    @InjectModel(Event)
    private eventModel: typeof Event,
    private configService: ConfigService,
  ) {}

  async initializePaystackTransaction(dto: InitializeTransactionDto) {
    const { eventId, fullName, email, amount, phoneNumber } = dto;

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
      amount: amount * 100,
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
      const transaction: CreateTransactionDto = {
        fullName,
        email,
        phoneNumber,
        eventId,
        amount,
        type: 'Card',
        transactionReference: data.reference,
        paymentLink: data.authorization_url,
      };

      if (result.status === true) {
        await this.trxModel.create({ ...transaction });
      }

      return {
        success: true,
        statusCode: HttpStatus.CREATED,
        message: 'Transaction in progress',
        data: transaction,
      };
    } catch (error) {
      throw error;
    }
  }

  async verifyTransaction(dto: PaystackCallbackDto) {
    const transaction = await this.trxModel.findOne({
      where: { transactionReference: dto.reference },
    });
    if (!transaction)
      throw new NotFoundException(
        'Transaction Not Found',
        `No transaction found with reference: ${dto.reference}`,
      );

    const url = `${PAYSTACK_VERIFY_BASE_URL}/${transaction.transactionReference}`;
    let response: AxiosResponse<PaystackVerifyTransactionResponseDto>;

    try {
      response = await axios.get<PaystackVerifyTransactionResponseDto>(url, {
        headers: {
          Authorization: `Bearer ${this.configService.get<string>('PAYSTACK_SECRET_KEY')}`,
        },
      });
      if (!response) return null;

      const result = response.data;
      const transactionStatus = result?.data?.status;

      const paymentConfirmed = transactionStatus === 'success';
      if (paymentConfirmed) {
        transaction.status = TransactionStatus.SUCCESS;
      } else {
        transaction.status = TransactionStatus.FAILED;
      }

      transaction.transactionStatus = transactionStatus;
      await transaction.save();

      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Transaction Verified',
        data: transaction,
      };
    } catch (error) {
      throw error;
    }
  }

  async handlePaystackWebhook(dto: PaystackWebhookDto, signature: string) {
    if (!dto.data) return false;

    let isValidEvent: string | boolean = false;

    try {
      const hash = createHmac(
        PAYSTACK_WEBHOOK_CRYPTO_ALGO,
        this.configService.get('PAYSTACK_SECRET_KEY') as KeyObject,
      )
        .update(JSON.stringify(dto))
        .digest('hex');

      isValidEvent =
        hash &&
        signature &&
        timingSafeEqual(Buffer.from(hash), Buffer.from(signature));

      if (!isValidEvent) {
        return false;
      }

      const transaction = await this.trxModel.findOne({
        where: {
          transactionReference: dto.data.reference,
        },
      });
      if (!transaction)
        throw new NotFoundException(
          'Transaction Not Found',
          `No transaction found with reference: ${dto.data.reference}`,
        );

      const transactionStatus = dto.data.status;
      const paymentConfirmed = transactionStatus === 'success';

      if (paymentConfirmed) {
        transaction.status = TransactionStatus.SUCCESS;
        transaction.transactionStatus = transactionStatus;
      } else {
        transaction.status = TransactionStatus.FAILED;
      }

      await transaction.save();

      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Transaction verified',
        data: transaction,
      };
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
