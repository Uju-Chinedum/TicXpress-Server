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
  HasMany,
} from 'sequelize-typescript';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { Ticket } from './ticket.entity';

@Table({
  tableName: 'events',
  paranoid: false,
  timestamps: true,
  underscored: false,
})
export class Event extends Model {
  @PrimaryKey
  @Unique
  @AllowNull(false)
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  public email: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  public phoneNumber: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  public organizer: string;

  @Unique
  @AllowNull(false)
  @Column(DataType.STRING)
  public name: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  public description: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  public imageUrl: string

  @AllowNull(false)
  @Column(DataType.STRING)
  public location: string;

  @AllowNull(false)
  @Column(DataType.DATE)
  public time: Date;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  public paid: boolean;

  @Unique
  @AllowNull(false)
  @Column(DataType.STRING)
  public dashboardCode: string;

  @AllowNull(false)
  @Default(true)
  @Column(DataType.BOOLEAN)
  public active: boolean;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  public registered: number;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  public totalAmount: number;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  public attended: number;

  @AllowNull(false)
  @CreatedAt
  @Column(DataType.DATE)
  declare createdAt: Date;

  @AllowNull(true)
  @UpdatedAt
  @Column(DataType.DATE)
  declare updatedAt: Date;

  @HasMany(() => Transaction, {
    as: 'transactions',
    hooks: true,
  })
  transactions: Transaction;

  @HasMany(() => Ticket, {
    as: 'tickets',
    hooks: true,
  })
  tickets: Ticket[];
}
