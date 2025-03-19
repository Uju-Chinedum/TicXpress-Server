import {
  IsString,
  IsEmail,
  IsDate,
  IsBoolean,
  IsOptional,
  IsNotEmpty,
  IsNumber,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateTransactionDto {
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
  @IsNumber()
  @IsNotEmpty({
    message: 'What is the amount for the event?',
  })
  amount: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({
    message: 'What is your payment type?',
  })
  type: 'Card' | 'Crypto';

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  transactionReference?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  paymentLink?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  transactionStatus?: string;
}