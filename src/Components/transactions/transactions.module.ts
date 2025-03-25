import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Transaction } from './entities/transaction.entity';
import { Event } from '../events/entities/event.entity';
import { Registration } from '../registrations/entities/registration.entity';
import { EmailService } from '../utils';

@Module({
  controllers: [TransactionsController],
  providers: [TransactionsService, EmailService],
  imports: [SequelizeModule.forFeature([Transaction, Event, Registration])],
  exports: [TransactionsService],
})
export class TransactionsModule {}
