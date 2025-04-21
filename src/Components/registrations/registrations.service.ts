import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Request } from 'express';
import { uuidv7 } from 'uuidv7';
import { Op } from 'sequelize';

import { CreateRegistrationDto } from './dto/create-registration.dto';
import { InitializeTransactionDto } from '../transactions/dto/create-transaction.dto';
import { Registration } from './entities/registration.entity';
import { Event } from '../events/entities/event.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { TransactionsService } from '../transactions/transactions.service';
import { TransactionResponse, TransactionType } from '../transactions/types';
import { RegistrationResponseData, RegistrationStatus } from './types';
import {
  eventRegistrationEmail,
  EmailService,
  successResponse,
  Utils,
} from '../../common/utils';
import {
  BadRequestException,
  InternalServerException,
  NotFoundException,
} from '../../common/exceptions';
import { AppResponse } from '../global/types';
import { Ticket } from '../events/entities/ticket.entity';

@Injectable()
export class RegistrationsService {
  constructor(
    @InjectModel(Registration) private registerModel: typeof Registration,
    @InjectModel(Event) private eventModel: typeof Event,
    @InjectModel(Transaction) private trxModel: typeof Transaction,
    private sequelize: Sequelize,
    private transactionService: TransactionsService,
    private emailService: EmailService,
    @InjectModel(Ticket) private ticketModel: typeof Ticket,
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

  async create(
    registrationBody: CreateRegistrationDto,
    req: Request,
  ): Promise<AppResponse<RegistrationResponseData>> {
    if (!registrationBody) {
      throw new BadRequestException(
        'Missing data',
        'Please provide all details.',
      );
    }

    const { eventId, type, fullName, email, phoneNumber, ticketId } =
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

    const isPaidEvent = event.dataValues.paid;
    const transaction = await this.sequelize.transaction();

    try {
      let ticket: Ticket | null = null;

      if (isPaidEvent) {
        if (!ticketId) {
          throw new BadRequestException(
            'Missing ticket',
            'Please select a ticket tier for this paid event.',
          );
        }

        ticket = await this.ticketModel.findOne({
          where: {
            id: ticketId,
            eventId,
            [Op.or]: [
              { quantity: 0 },
              Sequelize.literal('"quantity" > "registered"'),
            ],
          },
          transaction,
        });

        if (!ticket) {
          throw new BadRequestException(
            'Unavailable',
            'The selected ticket tier is either sold out or invalid.',
          );
        }
      }

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
            ticketId,
            fullName,
            email,
            phoneNumber,
          });

        const trxResult = appResponse.data;

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

      const eventUrl = Utils.generateEventUrl(event.dataValues.name, { req });
      await Utils.sendSuccessEmail({
        emailService: this.emailService,
        email,
        subject: `Registration successful for ${event.dataValues.name}`,
        htmlTemplate: eventRegistrationEmail(
          event.dataValues.name,
          event.dataValues.time.toISOString(),
          event.dataValues.location,
          event.dataValues.description,
          fullName,
          registration.dataValues.accessCode,
          eventUrl,
        ),
        eventUrl,
      });

      await this.eventModel.update(
        { registered: Sequelize.literal('registered + 1') },
        { where: { id: event.id }, transaction },
      );

      await this.ticketModel.update(
        { registered: Sequelize.literal('registered + 1') },
        { where: { id: ticket!.id }, transaction },
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
