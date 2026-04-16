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
  Default,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { TransactionStatus, TransactionType } from '../types';
import { Event } from '../../events/entities/event.entity';
import { Registration } from '../../registrations/entities/registration.entity';

@Table({
  tableName: 'transactions',
  paranoid: false,
  timestamps: true,
  underscored: false,
})
export class Transaction extends Model {
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

  @ForeignKey(() => Registration)
  @AllowNull(true)
  @Column(DataType.UUID)
  declare registrationId: string;

  @AllowNull(false)
  @Column(DataType.DECIMAL(20, 8))
  declare amount: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare currency: string;

  @Unique
  @AllowNull(false)
  @Column(DataType.STRING)
  declare transactionReference: string;

  @AllowNull(false)
  @Default(TransactionStatus.PENDING)
  @Column(DataType.ENUM(...Object.values(TransactionStatus)))
  declare status: TransactionStatus;

  @AllowNull(false)
  @Column(DataType.ENUM(...Object.values(TransactionType)))
  declare type: TransactionType;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare gatewayReference: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare paymentLink: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare gatewayStatus: string;

  @AllowNull(true)
  @Column(DataType.BOOLEAN)
  declare registrationCompleted: boolean;

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

  @BelongsTo(() => Registration)
  declare registration: Registration;
}
