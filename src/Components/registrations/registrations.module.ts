import { Module } from '@nestjs/common';
import { RegistrationsService } from './registrations.service';
import { RegistrationsController } from './registrations.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Registration } from './entities/registration.entity';
import { TransactionsModule } from '../transactions/transactions.module';
import { Event } from '../events/entities/event.entity';
import { Transaction } from '../transactions/entities/transaction.entity';

@Module({
  controllers: [RegistrationsController],
  providers: [RegistrationsService],
  imports: [
    SequelizeModule.forFeature([Registration, Event, Transaction]),
    TransactionsModule,
  ],
})
export class RegistrationsModule {}
