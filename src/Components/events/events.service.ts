import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { InjectModel } from '@nestjs/sequelize';
import { Event } from './entities/event.entity';
import { eventCreationEmail, Utils } from '../utils';
import { EmailService } from '../utils';
import { Sequelize } from 'sequelize-typescript';
import { InternalServerException } from '../../common/exceptions';

@Injectable()
export class EventsService {
  constructor(
    @InjectModel(Event)
    private eventModel: typeof Event,
    private emailService: EmailService,
    private sequelize: Sequelize,
  ) {}

  async create(eventBody: CreateEventDto) {
    const transaction = await this.sequelize.transaction();

    try {
      const { name, email, paid } = eventBody;
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
        );;
      }

      await transaction.commit();

      return {
        success: true,
        statusCode: HttpStatus.CREATED,
        message:
          'Event created successfully. Please check your mail for details.',
        data: event,
      };
    } catch (error) {
      await transaction.rollback();
      throw new InternalServerException(
        'Event Creation Error',
        'Error while creating event',
      );;
    }
  }

  async findAll() {
    return `This action returns all events`;
  }

  async findOne(id: number) {
    return `This action returns a #${id} event`;
  }

  async update(id: number, updateEventDto: UpdateEventDto) {
    return `This action updates a #${id} event`;
  }

  async remove(id: number) {
    return `This action removes a #${id} event`;
  }
}
