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

export class TicketDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty({
    message: 'What is the name of the ticket tier?',
  })
  name: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  amount?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsNotEmpty({
    message: 'What is the currency of the ticket tier?',
  })
  currency?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({
    message: 'What is the capacity of the ticket tier?',
  })
  quantity: string;
}
