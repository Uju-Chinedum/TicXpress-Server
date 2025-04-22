import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Request } from 'express';
import { uuidv7 } from 'uuidv7';

import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { Event } from './entities/event.entity';
import { Registration } from '../registrations/entities/registration.entity';
import {
  eventCreationEmail,
  Utils,
  EmailService,
  successResponse,
} from '../../common/utils';
import { PaginationDto } from '../global/dto';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '../../common/exceptions';
import { AppResponse, PaginatedResponse } from '../global/types';
import { Ticket } from './entities/ticket.entity';
import { UpdateTicketDto } from './dto/update-ticket.dto';

@Injectable()
export class EventsService {
  constructor(
    @InjectModel(Event) private eventModel: typeof Event,
    private emailService: EmailService,
    private sequelize: Sequelize,
    @InjectModel(Registration) private registerModel: typeof Registration,
    @InjectModel(Ticket) private ticketModel: typeof Ticket,
  ) {}

  private readonly eventAttributes = [
    'id',
    'organizer',
    'name',
    'description',
    'imageUrl',
    'location',
    'time',
    'paid',
    'updatedAt',
  ];

  private readonly organizerAttributes = [
    ...this.eventAttributes,
    'email',
    'phoneNumber',
    'active',
    'registered',
    'totalAmount',
  ];

  private readonly attendeeAttributes = [
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

  private async findEventByDashboardCode(
    dashboardCode: string,
    attributes?: string[],
  ): Promise<Event> {
    const event = await this.eventModel.findOne({
      where: { dashboardCode },
      attributes: attributes || this.organizerAttributes,
      include: [
        {
          model: Ticket,
          as: 'tickets',
          attributes: ['id', 'name', 'amount', 'currency', 'cryptoAmount'],
        },
      ],
    });
    if (!event) {
      throw new NotFoundException(
        'Event Not Found',
        `No event found with dashboard code matching ${dashboardCode}`,
      );
    }
    return event;
  }

  private async findEventById(
    id: string,
    attributes?: string[],
  ): Promise<Event> {
    const event = await this.eventModel.findOne({
      where: { id, active: true },
      attributes: attributes || this.eventAttributes,
      include: [
        {
          model: Ticket,
          as: 'tickets',
          attributes: ['id', 'name', 'amount', 'currency', 'cryptoAmount'],
        },
      ],
    });
    if (!event) {
      throw new NotFoundException(
        'Event Not Found',
        `No event found with id: ${id} or the event is no longer active`,
      );
    }
    return event;
  }

  async create(
    eventBody: CreateEventDto,
    req: Request,
  ): Promise<AppResponse<Partial<Event>>> {
    if (!eventBody)
      throw new BadRequestException(
        'Missing Details',
        'Please provide all details for your event.',
      );

    if (
      eventBody.paid &&
      (!Array.isArray(eventBody.tickets) || eventBody.tickets.length === 0)
    )
      throw new BadRequestException(
        'Missing Details',
        'Please provide ticket details for paid events.',
      );

    const transaction = await this.sequelize.transaction();

    try {
      const { name, email } = eventBody;
      const dashboardCode = Utils.generateDashboardCode();

      const event = await this.eventModel.create(
        { id: uuidv7(), ...eventBody, dashboardCode },
        { transaction },
      );

      if (eventBody.tickets?.length) {
        const tiers = await Promise.all(
          eventBody.tickets.map(async (tier) => ({
            ...tier,
            id: uuidv7(),
            eventId: event.id,
            cryptoAmount:
              tier.amount && tier.currency
                ? await Utils.fiatToCrypto(tier.amount, tier.currency)
                : undefined,
          })),
        );

        await this.ticketModel.bulkCreate(tiers, { transaction });
      }

      const createdTickets = await this.ticketModel.findAll({
        where: { eventId: event.id },
        transaction,
      });

      event.tickets = createdTickets;

      const eventUrl = Utils.generateEventUrl(name, {
        req,
        includeEventsPrefix: false,
        includeDashboardSuffix: true,
      });
      await Utils.sendSuccessEmail({
        emailService: this.emailService,
        email,
        subject: `${name} created successfully`,
        htmlTemplate: eventCreationEmail(event.get({ plain: true }), eventUrl),
        eventUrl,
      });

      await transaction.commit();

      const plainEvent = event.get({ plain: true }) as any;
      plainEvent.tickets = createdTickets.map((t) => {
        const ticket = t.get({ plain: true });
        return {
          id: ticket.id,
          name: ticket.name,
          amount: ticket.amount,
          currency: ticket.currency,
          cryptoAmount: ticket.cryptoAmount,
          cryptoCurrency: 'USDC',
        };
      });

      return successResponse(
        'Event created successfully. Check your email for details.',
        Object.fromEntries(
          this.eventAttributes.map((key) => [key, plainEvent[key]]),
        ),
        HttpStatus.CREATED,
      );
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async findAll(
    dto: PaginationDto,
  ): Promise<AppResponse<PaginatedResponse<Event>>> {
    try {
      const { page = 1, limit = 10 } = dto;
      const skip = Utils.calcSkip(page, limit);
      const events = await this.eventModel.findAndCountAll({
        where: { active: true },
        attributes: this.eventAttributes,
        offset: skip,
        limit,
        order: [['updatedAt', 'DESC']],
      });

      return successResponse(
        'Fetched All Events',
        Utils.paginateResponse([events.rows, events.count], page, limit),
      );
    } catch (error) {
      throw error;
    }
  }

  async findOne(id: string): Promise<AppResponse<Partial<Event>>> {
    const event = await this.findEventById(id);

    return successResponse('Fetched event', event);
  }

  async getDetails(
    dashboardCode: string,
  ): Promise<AppResponse<Partial<Event>>> {
    if (!dashboardCode)
      throw new UnauthorizedException(
        'Permission Denied',
        'Dashboard code required',
      );

    const event = await this.findEventByDashboardCode(dashboardCode);

    return successResponse('Fetched event details', event);
  }

  async update(
    dashboardCode: string,
    updateEventDto: UpdateEventDto,
  ): Promise<AppResponse<Partial<Event>>> {
    if (!dashboardCode)
      throw new UnauthorizedException(
        'Permission Denied',
        'Dashboard code required',
      );

    const [count, event] = await this.eventModel.update(
      { ...updateEventDto },
      { where: { dashboardCode }, returning: true },
    );
    if (count === 0)
      throw new NotFoundException(
        'Event Not Found',
        `No event found with dashboard code: ${dashboardCode}`,
      );

    return successResponse('Event Updated', event[0]);
  }

  async remove(dashboardCode: string): Promise<AppResponse<{}>> {
    if (!dashboardCode)
      throw new UnauthorizedException(
        'Permission Denied',
        'Dashboard code required',
      );

    const event = await this.eventModel.destroy({ where: { dashboardCode } });
    if (event === 0)
      throw new NotFoundException(
        'Event Not Found',
        `No event found with dashboard code: ${dashboardCode}`,
      );

    return successResponse('Event Deleted', {});
  }

  async verifyAttendee(
    dashboardCode: string,
    accessCode: string,
  ): Promise<AppResponse<Partial<Registration>>> {
    if (!dashboardCode)
      throw new UnauthorizedException(
        'Permission Denied',
        'Please provide your dashboad code to access this page',
      );

    const transaction = await this.sequelize.transaction();
    try {
      const event = await this.findEventByDashboardCode(dashboardCode);

      const attendee = await this.registerModel.findOne({
        where: { accessCode },
        attributes: this.attendeeAttributes,
      });

      if (!attendee)
        throw new BadRequestException('Invalid Access', 'Attendee not found');

      if (attendee.dataValues.eventId !== event.id)
        throw new BadRequestException(
          'Invalid Access',
          'Access to this event denied',
        );

      if (attendee.dataValues.status !== 'Approved')
        throw new BadRequestException(
          'Invalid Access',
          'Approval to this event not granted',
        );

      if (attendee.dataValues.verified)
        throw new BadRequestException(
          'Invalid Access',
          'Already verified for this event',
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
      return successResponse('Attendee Verified', verified[0]);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async updateTicket(
    dashboardCode: string,
    ticketId: string,
    updateTicketDto: UpdateTicketDto,
  ): Promise<AppResponse<Partial<Ticket>>> {
    if (!dashboardCode)
      throw new UnauthorizedException(
        'Permission Denied',
        'Please provide your dashboad code to access this page',
      );

    const [count, ticket] = await this.ticketModel.update(
      { ...updateTicketDto },
      { where: { id: ticketId }, returning: true },
    );
    if (count === 0)
      throw new NotFoundException(
        'Ticket Not Found',
        `No ticket found with id: ${ticketId}`,
      );

    return successResponse('Ticket Updated', ticket[0]);
  }
}
