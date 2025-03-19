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
import { uuidv7 } from 'uuidv7';
import { TransactionStatus, TransactionType } from '../types';
import { Event } from '../../events/entities/event.entity';

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
  eventId: string;

  @AllowNull(false)
  @Column(DataType.DECIMAL(20, 8))
  public amount: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  public transactionReference: string;

  @AllowNull(false)
  @Default(TransactionStatus.PENDING)
  @Column(DataType.ENUM(...Object.values(TransactionStatus)))
  public status: TransactionStatus;

  @AllowNull(false)
  @Column(DataType.ENUM(...Object.values(TransactionType)))
  public type: TransactionType;

  @AllowNull(true)
  @Column(DataType.STRING)
  public gatewayReference: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  public paymentLink: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  public gatewayStatus: string;

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
}
