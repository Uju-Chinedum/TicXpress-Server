import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Event } from './entities/event.entity';
import { EmailService } from '../../common/utils';
import { Registration } from '../registrations/entities/registration.entity';
import { Ticket } from './entities/ticket.entity';

@Module({
  controllers: [EventsController],
  providers: [EventsService, EmailService],
  imports: [SequelizeModule.forFeature([Event, Registration, Ticket])],
})
export class EventsModule {}
