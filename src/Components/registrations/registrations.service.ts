import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Request } from 'express';
import { uuidv7 } from 'uuidv7';

import { CreateRegistrationDto } from './dto/create-registration.dto';
import { InitializeTransactionDto } from '../transactions/dto/create-transaction.dto';
import { Registration } from './entities/registration.entity';
import { Event } from '../events/entities/event.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { TransactionsService } from '../transactions/transactions.service';
import { TransactionResponse, TransactionType } from '../transactions/types';
import { RegistrationStatus } from './types';
import { EmailService, Utils } from '../utils';
import { eventRegistrationEmail } from '../utils/templates/event-registration';
import {
  BadRequestException,
  InternalServerException,
  NotFoundException,
} from '../../common/exceptions';

@Injectable()
export class RegistrationsService {
  constructor(
    @InjectModel(Registration) private registerModel: typeof Registration,
    @InjectModel(Event) private eventModel: typeof Event,
    @InjectModel(Transaction) private trxModel: typeof Transaction,
    private sequelize: Sequelize,
    private transactionService: TransactionsService,
    private emailService: EmailService,
  ) {}

  private getTransactionInitializer(type: TransactionType) {
    const transactionInitializers = {
      [TransactionType.CARD]: (dto: InitializeTransactionDto) =>
        this.transactionService.initializePaystackTransaction(dto),
      [TransactionType.CRYPTO]: (dto: InitializeTransactionDto) =>
        this.transactionService.initializeCoingateTransaction(dto),
    };

    return (
      transactionInitializers[type] ||
      (() => {
        throw new BadRequestException(
          'Invalid Payment Type',
          'Payment type must be either "Card" or "Crypto".',
        );
      })
    );
  }

  async create(registrationBody: CreateRegistrationDto, req: Request) {
    if (!registrationBody) {
      throw new BadRequestException(
        'Missing data',
        'Please provide all details.',
      );
    }

    const { eventId, type, fullName, email, phoneNumber } = registrationBody;

    const event = await this.eventModel.findOne({
      where: { id: eventId, active: true },
    });
    if (!event) {
      throw new NotFoundException(
        'Event does not exist or is not active',
        `No event found with id: ${eventId}`,
      );
    }

    const isPaidEvent = event.dataValues.paid;
    const transaction = await this.sequelize.transaction();
    const baseUrl =
      req.headers.origin ||
      process.env.FFRONTEND_BASE_URL ||
      'https://ticxpress.com';

    try {
      const registrationId = uuidv7();
      const registration = await this.registerModel.create(
        {
          id: registrationId,
          ...registrationBody,
          transactionId: null,
          accessCode: isPaidEvent ? null : Utils.generateAccessCode(),
          status: isPaidEvent
            ? RegistrationStatus.PENDING
            : RegistrationStatus.APPROVED,
        },
        { transaction },
      );

      if (isPaidEvent) {
        if (!type) {
          throw new BadRequestException(
            'Missing payment type',
            'Please provide payment type.',
          );
        }

        const initializeTrx = this.getTransactionInitializer(type);
        const trxResult: TransactionResponse = await initializeTrx({
          eventId,
          fullName,
          email,
          phoneNumber,
        });

        await this.trxModel.update(
          { registrationId, registrationCompleted: false },
          { where: { id: trxResult.data.id }, transaction },
        );

        await this.registerModel.update(
          { transactionId: trxResult.data.id },
          { where: { id: registrationId }, transaction },
        );

        await transaction.commit();
        return this.buildResponse(
          HttpStatus.CREATED,
          'Registration Pending. Please proceed with payment',
          registration,
          event,
          trxResult.data.paymentLink,
        );
      }

      const eventUrl = `${baseUrl}/events/${event.name.replace(' ', '').toLowerCase()}/dashboard`;
      const emailResponse = await this.emailService.sendEmail(
        email,
        `Registration successful for ${event.name}`,
        eventRegistrationEmail(
          event.id,
          event.name,
          event.time.toISOString(),
          event.location,
          event.description,
          fullName,
          registration.accessCode,
          eventUrl,
        ),
      );

      if (!emailResponse.success) {
        await transaction.rollback();
        throw new InternalServerException(
          'Email Error',
          'Error while sending email',
        );
      }

      await this.eventModel.update(
        { registered: Sequelize.literal('registered + 1') },
        { where: { id: event.id }, transaction },
      );

      await transaction.commit();
      return this.buildResponse(
        HttpStatus.CREATED,
        'Registration successful',
        registration,
        event,
      );
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  private buildResponse(
    status: number,
    message: string,
    registration: Registration,
    event: Event,
    paymentLink?: string,
  ) {
    return {
      success: true,
      statusCode: status,
      message,
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
        paymentLink,
      },
    };
  }

  async findAll() {
    return 'This action returns all registrations';
  }

  async findOne(code: string) {
    return `This action returns a #${code} registration`;
  }
}
