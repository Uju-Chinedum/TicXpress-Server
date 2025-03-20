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

export class CreateErrorLogsDto {
  @ApiProperty()
  @IsEmail()
  @IsNotEmpty({
    message: 'What is the error level?',
  })
  level: string;

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty({
    message: 'What is the error name?',
  })
  name: string;

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty({
    message: 'What is the error message?',
  })
  message: string;

  @ApiProperty({ required: false })
  @IsEmail()
  @IsOptional()
  stack?: string;

  @ApiProperty({ required: false })
  @IsEmail()
  @IsOptional()
  context?: string;
}
