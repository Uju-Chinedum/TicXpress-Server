const { ConfigModule, ConfigService } = require('@nestjs/config');

ConfigModule.forRoot({
  envFilePath: [
    `src/Config/env/.env.${process.env.NODE_ENV || 'development'}`,
    'src/.env',
  ],
  isGlobal: true,
});

const configService = new ConfigService();

module.exports = {
  development: {
    username: configService.get('DB_USER'),
    password: configService.get('DB_PASSWORD'),
    database: configService.get('DB_NAME'),
    host: configService.get('DB_HOST'),
    port: configService.get('DB_PORT'),
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  },
  test: {
    username: configService.get('DB_USER'),
    password: configService.get('DB_PASSWORD'),
    database: configService.get('DB_NAME'),
    host: configService.get('DB_HOST'),
    port: configService.get('DB_PORT'),
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  },
  production: {
    username: configService.get('DB_USER'),
    password: configService.get('DB_PASSWORD'),
    database: configService.get('DB_NAME'),
    host: configService.get('DB_HOST'),
    port: configService.get('DB_PORT'),
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  },
};
