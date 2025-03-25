import {
  IsString,
  IsEmail,
  IsOptional,
  IsNotEmpty,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TransactionType } from '../../transactions/types';

export class CreateRegistrationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty({
    message: 'What is your full name?',
  })
  fullName: string;

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty({
    message: 'What is your email address?',
  })
  email: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({
    message: 'What is the id of the event?',
  })
  eventId: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  type?: TransactionType;
}
