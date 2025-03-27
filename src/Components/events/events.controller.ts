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
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { PaginationDto } from '../global/dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { v2 as cloudinary } from 'cloudinary';
import { cloudinaryOptions } from './types';

@Controller('api/v1/events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('image', {
      storage: new CloudinaryStorage({
        cloudinary,
        params: {
          folder: 'ticxpress',
          allowed_formats: ['jpg', 'jpeg', 'png'],
        },
      } as cloudinaryOptions),
    }),
  )
  create(
    @Body('data') data: string,
    @UploadedFile() image: Express.Multer.File,
    @Req() req,
  ) {
    const eventData: CreateEventDto = JSON.parse(data);
    const imageUrl = image ? image.path : null;
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
