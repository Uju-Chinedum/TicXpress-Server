import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { InjectModel } from '@nestjs/sequelize';
import { Event } from './entities/event.entity';
import { eventCreationEmail, Utils, EmailService } from '../utils';
import { Sequelize } from 'sequelize-typescript';
import {
  BadRequestException,
  InternalServerException,
  NotFoundException,
  UnauthorizedException,
} from '../../common/exceptions';
import { PaginationDto } from '../global/dto';
import { uuidv7 } from 'uuidv7';
import { Registration } from '../registrations/entities/registration.entity';

@Injectable()
export class EventsService {
  constructor(
    @InjectModel(Event)
    private eventModel: typeof Event,
    private emailService: EmailService,
    private sequelize: Sequelize,
    @InjectModel(Registration)
    private registerModel: typeof Registration,
  ) {}

  private readonly eventAttributes: string[] = [
    'id',
    'organizer',
    'name',
    'description',
    'location',
    'time',
    'paid',
    'amount',
    'cryptoAmount',
    'currency',
    'cryptoCurrency',
    'cryptoSymbol',
    'updatedAt',
  ];

  private readonly organizerAttributes: string[] = [
    'id',
    'email',
    'phoneNumber',
    'organizer',
    'name',
    'description',
    'location',
    'time',
    'paid',
    'amount',
    'cryptoAmount',
    'currency',
    'cryptoCurrency',
    'cryptoSymbol',
    'active',
    'registered',
    'totalAmount',
    'updatedAt',
  ];

  private readonly attendeeAttributes: string[] = [
    'id',
    'fullName',
    'email',
    'phoneNumber',
    'eventId',
    'status',
    'accessCode',
    'verified',
    'updatedAt',
  ];

  async create(eventBody: CreateEventDto) {
    if (!eventBody)
      throw new BadRequestException(
        'Missing Details',
        'Please provide all details for your event.',
      );

    const transaction = await this.sequelize.transaction();

    try {
      const { name, email, amount, currency, cryptoCurrency } = eventBody;
      const dashboardCode = Utils.generateDashboardCode();

      let cryptoAmount: number | undefined = undefined;
      if (amount && currency && cryptoCurrency) {
        cryptoAmount = await Utils.fiatToCrypto(
          amount,
          currency,
          cryptoCurrency,
        );
      }

      const event = await this.eventModel.create(
        {
          id: uuidv7(),
          ...eventBody,
          dashboardCode,
          cryptoAmount,
        },
        { transaction },
      );

      const emailResponse = await this.emailService.sendEmail(
        email,
        `${name} created successfully`,
        eventCreationEmail(event),
      );

      if (!emailResponse.success) {
        await transaction.rollback();
        throw new InternalServerException(
          'Email Error',
          'Error while sending email',
        );
      }

      await transaction.commit();

      const fullEvent = event.get({ plain: true });
      return {
        success: true,
        statusCode: HttpStatus.CREATED,
        message:
          'Event created successfully. Please check your mail for details.',
        data: {
          id: fullEvent.id,
          email: fullEvent.email,
          phoneNumber: fullEvent.phoneNumber,
          organizer: fullEvent.organizer,
          name: fullEvent.name,
          description: fullEvent.description,
          location: fullEvent.location,
          time: fullEvent.time,
          paid: fullEvent.paid,
          amount: fullEvent.amount,
          currency: fullEvent.currency,
          cryptoAmount: fullEvent.cryptoAmount,
          cryptoCurrency: fullEvent.cryptoCurrency,
          cryptoSymbol: fullEvent.cryptoSymbol,
          createdAt: fullEvent.createdAt,
        },
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async findAll(dto: PaginationDto) {
    try {
      const page = dto.page ?? 1;
      const limit = dto.limit ?? 10;
      const skip = Utils.calcSkip(page, limit);

      const events = await this.eventModel.findAndCountAll({
        where: { active: true },
        attributes: this.eventAttributes,
        offset: skip,
        limit,
        order: [['updatedAt', 'DESC']],
      });

      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Gotten all events successfully',
        data: Utils.paginateResponse([events.rows, events.count], page, limit),
      };
    } catch (error) {
      throw error;
    }
  }

  async findOne(id: string) {
    try {
      const event = await this.eventModel.findOne({
        where: { id, active: true },
        attributes: this.eventAttributes,
      });
      if (!event)
        throw new NotFoundException(
          'Event Not Found',
          `No event found with id: ${id} or the event is no longer active`,
        );

      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Gotten event successfully',
        data: event,
      };
    } catch (error) {
      throw error;
    }
  }

  async getDetails(dashboardCode: string) {
    if (!dashboardCode)
      throw new UnauthorizedException(
        'Permission Denied',
        'Please provide your dashboad code to access this page',
      );

    try {
      const event = await this.eventModel.findOne({
        where: { dashboardCode },
        attributes: this.organizerAttributes,
      });
      if (!event)
        throw new NotFoundException(
          'Event Not Found',
          `No event found with dashboard code matching ${dashboardCode}`,
        );

      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Gotten event successfully',
        data: event,
      };
    } catch (error) {
      throw error;
    }
  }

  async update(dashboardCode: string, updateEventDto: UpdateEventDto) {
    if (!dashboardCode)
      throw new UnauthorizedException(
        'Permission Denied',
        'Please provide your dashboad code to access this page',
      );

    try {
      const [count, event] = await this.eventModel.update(
        { ...updateEventDto },
        { where: { dashboardCode }, returning: true },
      );

      if (count === 0)
        throw new NotFoundException(
          'Event Not Found',
          `No event found with dashboard code matching ${dashboardCode}`,
        );

      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Updated event successfully',
        data: event[0],
      };
    } catch (error) {
      throw error;
    }
  }

  async remove(dashboardCode: string) {
    if (!dashboardCode)
      throw new UnauthorizedException(
        'Permission Denied',
        'Please provide your dashboad code to access this page',
      );

    try {
      const event = await this.eventModel.destroy({ where: { dashboardCode } });
      if (event === 0)
        throw new NotFoundException(
          'Event Not Found',
          `No event found with dashboard code matching ${dashboardCode}`,
        );

      return {
        success: true,
        statusCode: 200,
        message: 'Deleted event successfully',
        data: {},
      };
    } catch (error) {
      throw error;
    }
  }

  async verifyAttendee(dashboardCode: string, accessCode: string) {
    if (!dashboardCode)
      throw new UnauthorizedException(
        'Permission Denied',
        'Please provide your dashboad code to access this page',
      );

    const transaction = await this.sequelize.transaction();

    try {
      const event = await this.eventModel.findOne({
        where: { dashboardCode },
        attributes: this.organizerAttributes,
      });
      if (!event)
        throw new NotFoundException(
          'Event Not Found',
          `No event found with dashboard code matching ${dashboardCode} or access code matching ${accessCode}`,
        );

      if (!accessCode)
        throw new BadRequestException(
          'Missing Details',
          "Please provide attendee's access code.",
        );

      const attendee = await this.registerModel.findOne({
        where: { accessCode },
        attributes: this.attendeeAttributes,
      });

      if (!attendee)
        throw new NotFoundException(
          'Attendee Not Found',
          `No attendee found with access code matching ${accessCode}`,
        );

      if (attendee.dataValues.eventId !== event.id)
        throw new BadRequestException(
          'Attendee Not Found',
          `The access code provided is invalid for this event`,
        );

      if (attendee.dataValues.status !== 'Approved')
        throw new BadRequestException(
          'Attendee Not Approved',
          `Attendee with access code matching ${accessCode} is not yet approved`,
        );

      if (attendee.dataValues.verified)
        throw new BadRequestException(
          'Attendee Already Verified',
          `Attendee with access code matching ${accessCode} is already verified`,
        );

      const [count, verified] = await this.registerModel.update(
        { verified: true },
        {
          where: { accessCode },
          transaction,
          returning: this.attendeeAttributes,
        },
      );

      await this.eventModel.update(
        { registered: Sequelize.literal('registered + 1') },
        { where: { id: event.id }, transaction },
      );

      await transaction.commit();

      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Verified attendee successfully',
        data: verified[0],
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
