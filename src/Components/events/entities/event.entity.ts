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
} from 'sequelize-typescript';
import { uuidv7 } from 'uuidv7';

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
  @Default(uuidv7())
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
  @Column(DataType.NUMBER)
  public amount: number;

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
}
