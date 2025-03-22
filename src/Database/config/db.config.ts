import { ConfigService } from '@nestjs/config';
import { SequelizeModuleOptions } from '@nestjs/sequelize';
import { DBConfig } from '../types/db.interface';

export const dbConfig = (
  configService: ConfigService,
): SequelizeModuleOptions => {
  const env = configService.get<string>('NODE_ENV');
  const isProduction = env === 'production';
  const isTest = env === 'test';

  return {
    dialect: 'postgres',
    host: isProduction
      ? configService.get<string>('PROD_DB_HOST')
      : isTest
        ? configService.get<string>('TEST_DB_HOST')
        : configService.get<string>('DEV_DB_HOST'),
    port: isProduction
      ? configService.get<number>('PROD_DB_PORT')
      : isTest
        ? configService.get<number>('TEST_DB_PORT')
        : configService.get<number>('DEV_DB_PORT'),
    username: isProduction
      ? configService.get<string>('PROD_DB_USER')
      : isTest
        ? configService.get<string>('TEST_DB_USER')
        : configService.get<string>('DEV_DB_USER'),
    password: isProduction
      ? configService.get<string>('PROD_DB_PASSWORD')
      : isTest
        ? configService.get<string>('TEST_DB_PASSWORD')
        : configService.get<string>('DEV_DB_PASSWORD'),
    database: isProduction
      ? configService.get<string>('PROD_DB_NAME')
      : isTest
        ? configService.get<string>('TEST_DB_NAME')
        : configService.get<string>('DEV_DB_NAME'),
    autoLoadModels: true,
    synchronize: !isProduction,
    logging: isProduction ? false : true,
  } as DBConfig;
};
