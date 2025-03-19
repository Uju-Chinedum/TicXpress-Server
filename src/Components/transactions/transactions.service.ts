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
import {
  BadRequestException,
  NotFoundException,
} from '../../common/exceptions';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosResponse } from 'axios';
import {
  PAYSTACK_INIT_URL,
  PAYSTACK_VERIFY_BASE_URL,
  PAYSTACK_WEBHOOK_CRYPTO_ALGO,
} from '../global/constants';
import { TransactionStatus } from './types';
import { createHmac, timingSafeEqual } from 'crypto';
import { uuidv7 } from 'uuidv7';
import { Utils } from '../utils';

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
        transactionReference: Utils.generateTrxReference(),
        type: 'Card',
        gatewayReference: data.reference,
        paymentLink: data.authorization_url,
      };

      if (result.status === true) {
        await this.trxModel.create({ id: uuidv7(), ...transaction });
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

      let updatedTrx: any;
      if (paymentConfirmed) {
        const [count, trx] = await this.trxModel.update(
          {
            status: TransactionStatus.SUCCESS,
            gatewayStatus,
            paymentLink: null,
          },
          { where: { gatewayReference: dto.reference }, returning: true },
        );
        updatedTrx = trx;
      } else {
        const [count, trx] = await this.trxModel.update(
          {
            status: TransactionStatus.FAILED,
            gatewayStatus,
            paymentLink: null,
          },
          { where: { gatewayReference: dto.reference }, returning: true },
        );
        updatedTrx = trx;
      }

      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Transaction Verified',
        data: updatedTrx,
      };
    } catch (error) {
      throw error;
    }
  }

  async handlePaystackWebhook(dto: PaystackWebhookDto, signature: string) {
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

      let updatedTrx: any;
      if (paymentConfirmed) {
        const [count, trx] = await this.trxModel.update(
          {
            status: TransactionStatus.SUCCESS,
            gatewayStatus,
            paymentLink: null,
          },
          {
            where: { gatewayReference: dto.data.reference },
            returning: true,
          },
        );
        updatedTrx = trx;
      } else {
        const [count, trx] = await this.trxModel.update(
          {
            status: TransactionStatus.FAILED,
            gatewayStatus,
            paymentLink: null,
          },
          {
            where: { gatewayReference: dto.data.reference },
            returning: true,
          },
        );
        updatedTrx = trx;
      }

      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Transaction Verified',
        data: updatedTrx,
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
