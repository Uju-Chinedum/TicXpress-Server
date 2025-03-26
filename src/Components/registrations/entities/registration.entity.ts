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
  public fullName: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  public email: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  public phoneNumber: string;

  @ForeignKey(() => Event)
  @AllowNull(false)
  @Column(DataType.UUID)
  public eventId: string;

  @ForeignKey(() => Transaction)
  @AllowNull(true)
  @Column(DataType.UUID)
  public transactionId: string;

  @AllowNull(false)
  @Default(RegistrationStatus.PENDING)
  @Column(DataType.ENUM(...Object.values(RegistrationStatus)))
  public status: string;

  @Unique
  @AllowNull(true)
  @Column(DataType.STRING)
  public accessCode: string;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  public verified: boolean;

  @AllowNull(false)
  @CreatedAt
  @Column(DataType.DATE)
  declare createdAt: Date;

  @AllowNull(true)
  @UpdatedAt
  @Column(DataType.DATE)
  declare updatedAt: Date;

  @BelongsTo(() => Event)
  event: Event;

  @BelongsTo(() => Transaction)
  transaction: Transaction;
}
