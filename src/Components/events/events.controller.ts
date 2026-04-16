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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';

import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { PaginationDto } from '../global/dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Controller('api/v1/events')
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('image', {
      storage: multer.memoryStorage(),
    }),
  )
  async create(
    @Body('data') data: string,
    @UploadedFile() image: Express.Multer.File,
    @Req() req,
  ) {
    const eventData: CreateEventDto = data ? JSON.parse(data) : {};

    const imageUrl = image
      ? (await this.cloudinaryService.uploadImage(image)).secure_url
      : null;

    return this.eventsService.create({ ...eventData, imageUrl }, req);
  }

  @Get()
  findAll(@Query() pagination: PaginationDto) {
    return this.eventsService.findAll(pagination);
  }

  @Get('organizer')
  getStats(@Query('dashboardCode') dashboardCode: string) {
    return this.eventsService.getDetails(dashboardCode);
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

  @Get('organizer/registrations')
  getRegistrations(
    @Query('dashboardCode') dashboardCode: string,
    @Body('accessCode') accessCode: string,
  ) {
    return this.eventsService.verifyAttendee(dashboardCode, accessCode);
  }

  @Patch('organizer/tickets/:ticketId')
  updateTicket(
    @Query('dashboardCode') dashboardCode: string,
    @Param('ticketId') ticketId: string,
    @Body() updateTicketDto: UpdateTicketDto,
  ) {
    return this.eventsService.updateTicket(
      dashboardCode,
      ticketId,
      updateTicketDto,
    );
  }

  @Get(':eventId')
  findOne(@Param('eventId') eventId: string) {
    return this.eventsService.findOne(eventId);
  }
}
