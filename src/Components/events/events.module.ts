import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Event } from './entities/event.entity';
import { EmailService } from '../utils/email.service';

@Module({
  controllers: [EventsController],
  providers: [EventsService, EmailService],
  imports: [SequelizeModule.forFeature([Event])],
})
export class EventsModule {}
