import {
  AllowNull,
  Column,
  CreatedAt,
  DataType,
  Model,
  PrimaryKey,
  Table,
  Unique,
  UpdatedAt,
  ForeignKey,
  BelongsTo,
  Default,
} from 'sequelize-typescript';
import { Event } from '../../events/entities/event.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { RegistrationStatus } from '../types';
import { Ticket } from '../../events/entities/ticket.entity';

@Table({
  tableName: 'registrations',
  paranoid: false,
  timestamps: true,
  underscored: false,
})
export class Registration extends Model {
  @PrimaryKey
  @Unique
  @AllowNull(false)
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare fullName: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare email: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare phoneNumber: string;

  @ForeignKey(() => Event)
  @AllowNull(false)
  @Column(DataType.UUID)
  declare eventId: string;

  @ForeignKey(() => Ticket)
  @AllowNull(true)
  @Column(DataType.UUID)
  declare ticketId: string;

  @ForeignKey(() => Transaction)
  @AllowNull(true)
  @Column(DataType.UUID)
  declare transactionId: string;

  @AllowNull(false)
  @Default(RegistrationStatus.PENDING)
  @Column(DataType.ENUM(...Object.values(RegistrationStatus)))
  declare status: string;

  @Unique
  @AllowNull(true)
  @Column(DataType.STRING)
  declare accessCode: string;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  declare verified: boolean;

  @AllowNull(false)
  @CreatedAt
  @Column(DataType.DATE)
  declare createdAt: Date;

  @AllowNull(true)
  @UpdatedAt
  @Column(DataType.DATE)
  declare updatedAt: Date;

  @BelongsTo(() => Event)
  declare event: Event;

  @BelongsTo(() => Transaction)
  declare transaction: Transaction;

  @BelongsTo(() => Ticket)
  declare ticket: Ticket;
}
