import { ConfigService } from '@nestjs/config';
import { SequelizeModuleOptions } from '@nestjs/sequelize';
import { DBConfig } from '../types/db.interface';

export const dbConfig = (
  configService: ConfigService,
): SequelizeModuleOptions =>
  ({
    dialect: 'postgres',
    host: configService.get<string>('DB_HOST'),
    port: configService.get<number>('DB_PORT'),
    username: configService.get<string>('DB_USER'),
    password: configService.get<string>('DB_PASSWORD'),
    database: configService.get<string>('DB_NAME'),
    autoLoadModels: true,
    synchronize: configService.get<string>('NODE_ENV') !== 'production',
    logging:
      configService.get<string>('DB_LOGGING') === 'true' ? console.log : false,
  }) as DBConfig;
