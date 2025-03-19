import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Transaction } from './entities/transaction.entity';
import { Event } from '../events/entities/event.entity';

@Module({
  controllers: [TransactionsController],
  providers: [TransactionsService],
  imports: [SequelizeModule.forFeature([Transaction, Event])],
  exports: [TransactionsService],
})
export class TransactionsModule {}
