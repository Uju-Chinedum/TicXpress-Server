import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { PaginationDto } from '../global/dto';

@Controller('api/v1/events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  create(@Body() createEventDto: CreateEventDto, @Req() req) {
    return this.eventsService.create(createEventDto, req);
  }

  @Get()
  findAll(@Query() pagination: PaginationDto) {
    return this.eventsService.findAll(pagination);
  }

  @Get('organizer')
  getStats(@Query('dashboardCode') dashboardCode: string) {
    return this.eventsService.getDetails(dashboardCode);
  }

  @Get('organizer/registrations')
  getRegistrations(
    @Query('dashboardCode') dashboardCode: string,
    @Body('accessCode') accessCode: string,
  ) {
    return this.eventsService.verifyAttendee(dashboardCode, accessCode);
  }

  @Patch('organizer')
  update(
    @Query('dashboardCode') dashboardCode: string,
    @Body() updateEventDto: UpdateEventDto,
  ) {
    return this.eventsService.update(dashboardCode, updateEventDto);
  }

  @Delete('organizer')
  remove(@Query('dashboardCode') dashboardCode: string) {
    return this.eventsService.remove(dashboardCode);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }
}
