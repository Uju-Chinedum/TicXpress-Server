import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { PaginationDto } from '../global/dto';

@Controller('api/v1/events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  create(@Body() createEventDto: CreateEventDto) {
    return this.eventsService.create(createEventDto);
  }

  @Get()
  findAll(@Query() pagination: PaginationDto) {
    return this.eventsService.findAll(pagination);
  }

  @Get('organizer')
  getStats(@Query('code') code: string) {
    return this.eventsService.getDetails(code);
  }

  @Get('organizer/registrations')
  getRegistrations(
    @Query('dashboardCode') dashboardCode: string,
    @Body('accessCode') accessCode: string,
  ) {
    return this.eventsService.verifyAttendee(dashboardCode, accessCode);
  }

  @Patch('organizer')
  update(@Query('code') code: string, @Body() updateEventDto: UpdateEventDto) {
    return this.eventsService.update(code, updateEventDto);
  }

  @Delete('organizer')
  remove(@Query('code') code: string) {
    return this.eventsService.remove(code);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }
}
