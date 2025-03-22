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
import { Transaction } from 'src/Components/transactions/entities/transaction.entity';

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

  @AllowNull(true)
  @Column(DataType.INTEGER)
  public amount: number;

  @AllowNull(true)
  @Column(DataType.DECIMAL(20, 8))
  public cryptoAmount: number;

  @AllowNull(true)
  @Column(DataType.STRING)
  public currency: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  public cryptoCurrency: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  public cryptoSymbol: string;

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
  @Column(DataType.NUMBER)
  public count: number;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.NUMBER)
  public totalAmount: number;

  @AllowNull(false)
  @CreatedAt
  @Column(DataType.DATE)
  declare createdAt: Date;

  @AllowNull(true)
  @UpdatedAt
  @Column(DataType.DATE)
  declare updatedAt: Date;

  @HasMany(() => Transaction, {
    as: "transactions",
    hooks: true,
  })
  transactions: Transaction;
}
