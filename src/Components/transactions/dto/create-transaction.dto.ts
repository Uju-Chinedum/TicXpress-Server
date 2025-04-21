import {
  IsString,
  IsEmail,
  IsOptional,
  IsNotEmpty,
  IsNumber,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TransactionType } from '../types';

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
    message: 'What is the currency of the amount?',
  })
  currency: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({
    message: 'What is the transaction reference?',
  })
  transactionReference: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({
    message: 'What is your payment type?',
  })
  type: TransactionType;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  gatewayReference?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  paymentLink?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  gatewayStatus?: string;
}

export class InitializeTransactionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty({
    message: 'What is the event id?',
  })
  eventId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({
    message: 'What is the ticket id?',
  })
  ticketId?: string;

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
  @IsString()
  @IsOptional()
  phoneNumber?: string;
}
