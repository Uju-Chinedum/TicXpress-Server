import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { dbConfig } from '../../Database/config/db.config';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        `src/Config/env/.env.${process.env.NODE_ENV || 'development'}`,
        '../.env',
      ],
    }),
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => dbConfig(configService),
    }),
    EventsModule
  ],
})
export class AppModule {}
