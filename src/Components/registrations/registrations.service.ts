import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { InjectModel } from '@nestjs/sequelize';
import { Registration } from './entities/registration.entity';
import {
  BadRequestException,
  NotFoundException,
} from '../../common/exceptions';
import { Sequelize } from 'sequelize-typescript';
import { TransactionsService } from '../transactions/transactions.service';
import { Event } from '../events/entities/event.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { InitializeTransactionDto } from '../transactions/dto/create-transaction.dto';
import {
  TransactionResponse,
  TransactionStatus,
  TransactionType,
} from '../transactions/types';
import { uuidv7 } from 'uuidv7';
import { Utils } from '../utils';

@Injectable()
export class RegistrationsService {
  constructor(
    @InjectModel(Registration)
    private registerModel: typeof Registration,
    @InjectModel(Event)
    private eventModel: typeof Event,
    private sequelize: Sequelize,
    private transactionService: TransactionsService,
    @InjectModel(Transaction)
    private trxModel: typeof Transaction,
  ) {}

  private async checkTrxStatus(trxId: string) {
    const trx = await this.trxModel.findByPk(trxId);
    if (!trx) {
      throw new NotFoundException(
        'Transaction not found',
        `No transaction found with id: ${trxId}`,
      );
    }

    if (trx.status !== TransactionStatus.SUCCESS) {
      throw new BadRequestException(
        'Transaction Failed',
        'Transaction could not be completed. Please try again',
      );
    }
  }

  private getTransactionInitializer(type: TransactionType) {
    switch (type) {
      case TransactionType.CARD:
        return this.transactionService.initializePaystackTransaction;
      case TransactionType.CRYPTO:
        return this.transactionService.initializeCoingateTransaction;
      default:
        throw new BadRequestException(
          'Invalid Payment Type',
          'Payment type must be either "Card" or "Crypto".',
        );
    }
  }

  async create(registrationBody: CreateRegistrationDto) {
    if (!registrationBody)
      throw new BadRequestException(
        'Missing data',
        'Please provide all details.',
      );

    const { eventId, paid, type, fullName, email, phoneNumber } =
      registrationBody;

    const event = await this.eventModel.findOne({
      where: { id: eventId, active: true },
    });
    if (!event) {
      throw new NotFoundException(
        'Event does not exist or is not active',
        `No event found with id: ${eventId}`,
      );
    }

    const transaction = await this.sequelize.transaction();

    try {
      let transactionId: string | undefined;
      const registrationId = uuidv7();

      if (paid) {
        if (!type) {
          throw new BadRequestException(
            'Missing payment type',
            'Please provide payment type.',
          );
        }

        const initializeTrx = this.getTransactionInitializer(type).bind(
          this.transactionService,
        );
        const trxResult: TransactionResponse = await initializeTrx({
          eventId,
          fullName,
          email,
          phoneNumber,
        });

        await this.checkTrxStatus(trxResult.data.id);

        transactionId = trxResult.data.id;
        await this.trxModel.update(
          { registrationId },
          { where: { id: transactionId }, transaction },
        );
      }

      const registration = await this.registerModel.create(
        {
          id: registrationId,
          ...registrationBody,
          transactionId,
          accessCode: Utils.generateAccessCode(),
        },
        { transaction },
      );

      await this.eventModel.update(
        { count: event.count + 1 },
        { where: { id: eventId }, transaction },
      );

      await transaction.commit();

      return {
        success: true,
        statusCode: HttpStatus.CREATED,
        message:
          'Registration created successfully. Please check your mail for details.',
        data: {
          id: registration.id,
          fullName: registration.fullName,
          email: registration.email,
          phoneNumber: registration.phoneNumber,
          accessCode: registration.accessCode,
          createdAt: registration.createdAt,
          event: {
            id: event.id,
            organizer: event.organizer,
            name: event.name,
            description: event.description,
            location: event.location,
            time: event.time,
          },
        },
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async findAll() {
    return `This action returns all registrations`;
  }

  async findOne(code: string) {
    return `This action returns a #${code} registration`;
  }
}
