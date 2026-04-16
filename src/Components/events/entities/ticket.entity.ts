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
  HasMany,
} from 'sequelize-typescript';
import { Event } from './event.entity';
import { Registration } from '../../registrations/entities/registration.entity';

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
  declare eventId: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare name: string;

  @AllowNull(true)
  @Column(DataType.INTEGER)
  declare amount: number;

  @AllowNull(true)
  @Column(DataType.DECIMAL(20, 8))
  declare cryptoAmount: number;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare currency: string;

  @AllowNull(true)
  @Default(0)
  @Column(DataType.INTEGER)
  declare quantity: number;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  declare registered: number;

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

  @HasMany(() => Registration, {
    as: 'registrations',
    hooks: true,
  })
  declare registrations: Registration[];
}
