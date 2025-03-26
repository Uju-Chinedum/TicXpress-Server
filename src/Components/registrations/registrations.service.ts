import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { InjectModel } from '@nestjs/sequelize';
import { Registration } from './entities/registration.entity';
import {
  BadRequestException,
  InternalServerException,
  NotFoundException,
} from '../../common/exceptions';
import { Sequelize } from 'sequelize-typescript';
import { TransactionsService } from '../transactions/transactions.service';
import { Event } from '../events/entities/event.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { TransactionResponse, TransactionType } from '../transactions/types';
import { uuidv7 } from 'uuidv7';
import { EmailService, Utils } from '../utils';
import { InitializeTransactionDto } from '../transactions/dto/create-transaction.dto';
import { RegistrationStatus } from './types';
import { eventRegistrationEmail } from '../utils/templates/event-registration';

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
    private emailService: EmailService,
  ) {}

  private getTransactionInitializer(type: TransactionType) {
    switch (type) {
      case TransactionType.CARD:
        return (dto: InitializeTransactionDto) =>
          this.transactionService.initializePaystackTransaction(dto);
      case TransactionType.CRYPTO:
        return (dto: InitializeTransactionDto) =>
          this.transactionService.initializeCoingateTransaction(dto);
      default:
        throw new BadRequestException(
          'Invalid Payment Type',
          'Payment type must be either "Card" or "Crypto".',
        );
    }
  }

  async create(registrationBody: CreateRegistrationDto) {
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

    const paid = event.dataValues.paid;
    const transaction = await this.sequelize.transaction();

    try {
      let transactionId: string | undefined;
      let paymentLink: string | undefined;
      const registrationId = uuidv7();

      const registration = await this.registerModel.create(
        {
          id: registrationId,
          ...registrationBody,
          transactionId: null,
          accessCode: paid ? null : Utils.generateAccessCode(),
          status: paid
            ? RegistrationStatus.PENDING
            : RegistrationStatus.APPROVED,
        },
        { transaction },
      );

      if (paid) {
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

        transactionId = trxResult.data.id;
        paymentLink = trxResult.data.paymentLink;

        await this.trxModel.update(
          { registrationId, registrationCompleted: false },
          { where: { id: transactionId }, transaction },
        );

        await this.registerModel.update(
          { transactionId: transactionId },
          { where: { id: registrationId }, transaction },
        );

        await transaction.commit();

        const fullEvent = event.get({ plain: true });
        const fullRegistration = registration.get({ plain: true });
        return {
          success: true,
          statusCode: HttpStatus.CREATED,
          message: 'Registration Pending. Please proceed with payment',
          data: {
            id: fullRegistration.id,
            fullName: fullRegistration.fullName,
            email: fullRegistration.email,
            phoneNumber: fullRegistration.phoneNumber,
            accessCode: fullRegistration.accessCode,
            createdAt: fullRegistration.createdAt,
            event: {
              id: fullEvent.id,
              organizer: fullEvent.organizer,
              name: fullEvent.name,
              description: fullEvent.description,
              location: fullEvent.location,
              time: fullEvent.time,
            },
            paymentLink,
          },
        };
      } else {
        const fullEvent = event.get({ plain: true });

        const emailResponse = await this.emailService.sendEmail(
          email,
          `Registration successful for ${fullEvent.name}`,
          eventRegistrationEmail(
            fullEvent.id,
            fullEvent.name,
            fullEvent.time,
            fullEvent.location,
            fullEvent.description,
            fullName,
            registration.dataValues.accessCode,
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

        const fullRegistration = registration.get({ plain: true });

        return {
          success: true,
          statusCode: HttpStatus.CREATED,
          message: 'Registration successful',
          data: {
            id: fullRegistration.id,
            fullName: fullRegistration.fullName,
            email: fullRegistration.email,
            phoneNumber: fullRegistration.phoneNumber,
            accessCode: fullRegistration.accessCode,
            createdAt: fullRegistration.createdAt,
            event: {
              id: fullEvent.id,
              organizer: fullEvent.organizer,
              name: fullEvent.name,
              description: fullEvent.description,
              location: fullEvent.location,
              time: fullEvent.time,
            },
          },
        };
      }
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
