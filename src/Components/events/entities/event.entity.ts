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
  declare public id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  public name: string;

  @Unique
  @AllowNull(false)
  @Column(DataType.STRING)
  public email: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  public description: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  public location: string;

  @AllowNull(false)
  @Column(DataType.DATE)
  public time: Date;

  @Unique
  @AllowNull(false)
  @Column(DataType.STRING)
  public dashboardCode: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  public phoneNumber: string;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  public paid: boolean;

  @AllowNull(false)
  @CreatedAt
  @Column(DataType.DATE)
  declare public createdAt: Date;

  @AllowNull(true)
  @UpdatedAt
  @Column(DataType.DATE)
  declare public updatedAt: Date;
}
