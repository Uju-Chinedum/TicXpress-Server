import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { dbConfig } from '../../Database/config/db.config';
import { EventsModule } from '../events/events.module';
import { GlobalModule } from '../global/global.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { RegistrationsModule } from '../registrations/registrations.module';
import { CloudinaryProvider } from '../../common/utils';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../.env'],
    }),
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => dbConfig(configService),
    }),
    EventsModule,
    GlobalModule,
    TransactionsModule,
    RegistrationsModule,
  ],
  providers: [CloudinaryProvider],
  exports: [CloudinaryProvider],
})
export class AppModule {}
