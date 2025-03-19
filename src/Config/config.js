const { ConfigModule, ConfigService } = require('@nestjs/config');

ConfigModule.forRoot();
const configService = new ConfigService();

module.exports = {
  development: {
    username: configService.get('DEV_DB_USER'),
    password: configService.get('DEV_DB_PASSWORD'),
    database: configService.get('DEV_DB_NAME'),
    host: configService.get('DEV_DB_HOST'),
    port: configService.get('DEV_DB_PORT'),
    dialect: 'postgres',
    dialectOptions: {
      ssl:
        configService.get('DB_SSL') === true
          ? { require: true, rejectUnauthorized: false }
          : false,
    },
  },
  test: {
    username: configService.get('TEST_DB_USER'),
    password: configService.get('TEST_DB_PASSWORD'),
    database: configService.get('TEST_DB_NAME'),
    host: configService.get('TEST_DB_HOST'),
    port: configService.get('TEST_DB_PORT'),
    dialect: 'postgres',
    dialectOptions: {
      ssl:
        configService.get('DB_SSL') === true
          ? { require: true, rejectUnauthorized: false }
          : false,
    },
  },
  production: {
    username: configService.get('PROD_DB_USER'),
    password: configService.get('PROD_DB_PASSWORD'),
    database: configService.get('PROD_DB_NAME'),
    host: configService.get('PROD_DB_HOST'),
    port: configService.get('PROD_DB_PORT'),
    dialect: 'postgres',
    dialectOptions: {
      ssl:
        configService.get('DB_SSL') === true
          ? { require: true, rejectUnauthorized: false }
          : false,
    },
  },
};
