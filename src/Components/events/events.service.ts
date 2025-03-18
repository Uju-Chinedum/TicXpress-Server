import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { InjectModel } from '@nestjs/sequelize';
import { Event } from './entities/event.entity';
import { eventCreationEmail, Utils } from '../utils';
import { EmailService } from '../utils';
import { Sequelize } from 'sequelize-typescript';
import { InternalServerException } from '../../common/exceptions';
import { PaginationDto } from '../global/dto';

@Injectable()
export class EventsService {
  constructor(
    @InjectModel(Event)
    private eventModel: typeof Event,
    private emailService: EmailService,
    private sequelize: Sequelize,
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
    'createdAt',
  ];

  async create(eventBody: CreateEventDto) {
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
        attributes: this.eventAttributes,
        offset: skip,
        limit,
        order: [['createdAt', 'DESC']],
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
        where: { id },
        attributes: this.eventAttributes,
      });

      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Gotten event successfully',
        data: { ...event?.dataValues },
      };
    } catch (error) {
      throw error;
    }
  }

  async update(id: number, updateEventDto: UpdateEventDto) {
    return `This action updates a #${id} event`;
  }

  async remove(id: number) {
    return `This action removes a #${id} event`;
  }
}
