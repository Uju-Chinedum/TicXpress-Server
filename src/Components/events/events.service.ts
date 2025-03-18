import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { InjectModel } from '@nestjs/sequelize';
import { Event } from './entities/event.entity';
import { eventCreationEmail, Utils } from '../utils';
import { EmailService } from '../utils';
import { Sequelize } from 'sequelize-typescript';
import {
  BadRequestException,
  InternalServerException,
  NotFoundException,
} from '../../common/exceptions';
import { PaginationDto } from '../global/dto';
import { truncateSync } from 'fs';

@Injectable()
export class EventsService {
  constructor(
    @InjectModel(Event)
    private eventModel: typeof Event,
    private emailService: EmailService,
    private sequelize: Sequelize,
  ) {}

  private readonly attendeeAttributes: string[] = [
    'id',
    'organizer',
    'name',
    'description',
    'location',
    'time',
    'paid',
    'amount',
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
    'active',
    'count',
    'totalAmount',
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
      const { name, email } = eventBody;
      const dashboardCode = Utils.generateDashboardCode();

      const event = await this.eventModel.create(
        {
          ...eventBody,
          dashboardCode,
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
        attributes: this.attendeeAttributes,
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
        attributes: this.attendeeAttributes,
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
      throw new BadRequestException(
        'Missing Details',
        'Please provide your dashboad code',
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

  async remove(id: string) {
    return `This action removes a #${id} event`;
  }
}
