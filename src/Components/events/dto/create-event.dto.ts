import {
  IsString,
  IsEmail,
  IsDate,
  IsBoolean,
  IsOptional,
  IsNotEmpty,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { TicketDto } from './ticket.dto';

export class CreateEventDto {
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
    message: 'Who is the organizer of the event?',
  })
  organizer: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({
    message: 'What is the name of your event?',
  })
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({
    message: 'What is your event about?',
  })
  description: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  imageUrl?: string | null;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  capacity?: number;

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

  @ApiProperty()
  @IsBoolean()
  paid: boolean = false;

  @ApiProperty({ required: false })
  @IsOptional()
  @ValidateNested({each: true})
  @Type(() => TicketDto)
  tickets?: TicketDto[];
}
