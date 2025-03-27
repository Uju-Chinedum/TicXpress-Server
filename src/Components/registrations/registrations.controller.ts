import { Controller, Get, Post, Body, Patch, Param, Delete, Req } from '@nestjs/common';
import { RegistrationsService } from './registrations.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';

@Controller('api/v1/registrations')
export class RegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) {}

  @Post()
  create(@Body() createRegistrationDto: CreateRegistrationDto, @Req() req) {
    return this.registrationsService.create(createRegistrationDto, req);
  }

  @Get()
  findAll() {
    return this.registrationsService.findAll();
  }

  @Get(':id')
  findOne(@Param('code') code: string) {
    return this.registrationsService.findOne(code);
  }
}
