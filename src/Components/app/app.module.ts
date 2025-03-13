import { forwardRef, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { dbConfig } from 'src/Database/config/db.config';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    SequelizeModule.forRoot(dbConfig),
    forwardRef(() => AuthModule),
    forwardRef(() => UsersModule),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
