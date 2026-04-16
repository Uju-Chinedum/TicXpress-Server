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
  declare email: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare phoneNumber: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare organizer: string;

  @Unique
  @AllowNull(false)
  @Column(DataType.STRING)
  declare name: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare description: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare imageUrl: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare location: string;

  @AllowNull(false)
  @Column(DataType.DATE)
  declare time: Date;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  declare paid: boolean;

  @Unique
  @AllowNull(false)
  @Column(DataType.STRING)
  declare dashboardCode: string;

  @AllowNull(false)
  @Default(true)
  @Column(DataType.BOOLEAN)
  declare active: boolean;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  declare registered: number;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  declare totalAmount: number;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  declare attended: number;

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
  declare transactions: Transaction;

  @HasMany(() => Ticket, {
    as: 'tickets',
    hooks: true,
  })
  declare tickets: Ticket[];
}
