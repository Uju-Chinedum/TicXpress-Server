import { Injectable } from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { InjectModel } from '@nestjs/sequelize';
import { Event } from './entities/event.entity';
import { Utils } from '../utils';

@Injectable()
export class EventsService {
  constructor(
    @InjectModel(Event)
    private eventModel: typeof Event,
  ) {}

  async create(createEventDto: CreateEventDto) {
    return await this.eventModel.create({
      ...createEventDto,
      dashboardCode: Utils.generateDashboardCode(),
    });
  }

  async findAll() {
    return `This action returns all events`;
  }

  async findOne(id: number) {
    return `This action returns a #${id} event`;
  }

  async update(id: number, updateEventDto: UpdateEventDto) {
    return `This action updates a #${id} event`;
  }

  async remove(id: number) {
    return `This action removes a #${id} event`;
  }
}
