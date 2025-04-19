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
import { Event } from './event.entity';

@Table({
  tableName: 'tickets',
  paranoid: false,
  timestamps: true,
  underscored: false,
})
export class Ticket extends Model {
  @PrimaryKey
  @Unique
  @AllowNull(false)
  @Column(DataType.UUID)
  declare id: string;

  @ForeignKey(() => Event)
  @AllowNull(false)
  @Column(DataType.UUID)
  public eventId: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  public name: string;

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
  @Default(0)
  @Column(DataType.INTEGER)
  public quantity: number;

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
