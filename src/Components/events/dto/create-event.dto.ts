import {
  IsString,
  IsEmail,
  IsDate,
  IsBoolean,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateEventDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty({
    message: 'What is the name of your event?',
  })
  name: string;

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty({
    message: 'What is your email address?',
  })
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({
    message: 'What is your event about?',
  })
  description: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({
    message: 'Where is your event?',
  })
  location: string;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty({
    message: 'What time is your event?',
  })
  time: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty()
  @IsBoolean()
  paid: boolean = false;
}