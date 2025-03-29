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
import { RegistrationResponseData, RegistrationStatus } from './types';
import { EmailService, Utils } from '../utils';
import { eventRegistrationEmail } from '../utils/templates/event-registration';
import {
  BadRequestException,
  InternalServerException,
  NotFoundException,
} from '../../common/exceptions';
import { AppResponse } from '../global/types';
import { successResponse } from '../utils/app';

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

  async create(registrationBody: CreateRegistrationDto, req: Request): Promise<AppResponse<RegistrationResponseData>> {
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

    if (
      event.dataValues.capacity !== 0 &&
      event.dataValues.registered === event.dataValues.capacity
    ) {
      throw new BadRequestException(
        'Capacity Filled',
        'The capacity for this event has been reached',
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

      const responseData: RegistrationResponseData = {
        id: registration.dataValues.id,
        fullName: registration.dataValues.fullName,
        email: registration.dataValues.email,
        phoneNumber: registration.dataValues.phoneNumber,
        accessCode: registration.dataValues.accessCode,
        createdAt: registration.dataValues.createdAt,
        event: {
          id: event.dataValues.id,
          organizer: event.dataValues.organizer,
          name: event.dataValues.name,
          description: event.dataValues.description,
          location: event.dataValues.location,
          time: event.dataValues.time,
        },
        paymentLink: undefined,
      };

      if (isPaidEvent) {
        if (!type) {
          throw new BadRequestException(
            'Missing payment type',
            'Please provide payment type.',
          );
        }

        const initializeTrx = this.getTransactionInitializer(type);
        const appResponse: AppResponse<TransactionResponse> =
          await initializeTrx({
            eventId,
            fullName,
            email,
            phoneNumber,
          });

        const trxResult: TransactionResponse = appResponse.data;

        await this.trxModel.update(
          { registrationId, registrationCompleted: false },
          { where: { id: trxResult.id }, transaction },
        );

        await this.registerModel.update(
          { transactionId: trxResult.id },
          { where: { id: registrationId }, transaction },
        );

        await transaction.commit();
        responseData.paymentLink = trxResult.paymentLink;
        return successResponse(
          'Registration Pending. Please proceed with payment',
          responseData,
          HttpStatus.CREATED,
        );
      }

      const eventUrl = `${baseUrl}/events/${event.dataValues.name.replace(/\s+/g, '').toLowerCase()}/dashboard`;
      const qrCodeBuffer = await Utils.generateQRCode(eventUrl);

      const emailResponse = await this.emailService.sendEmail(
        email,
        `Registration successful for ${event.dataValues.name}`,
        eventRegistrationEmail(
          event.dataValues.id,
          event.dataValues.name,
          event.dataValues.time.toISOString(),
          event.dataValues.location,
          event.dataValues.description,
          fullName,
          registration.dataValues.accessCode,
          eventUrl,
        ),
        [
          {
            filename: 'event_qrcode.png',
            content: qrCodeBuffer,
            contentType: 'image/png',
          },
        ],
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
      return successResponse(
        'Registration successful',
        responseData,
        HttpStatus.CREATED,
      );
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async findAll() {
    return 'This action returns all registrations';
  }

  async findOne(code: string) {
    return `This action returns a #${code} registration`;
  }
}
