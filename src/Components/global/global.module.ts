import { Module } from '@nestjs/common';
import { GlobalService } from './global.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { ErrorLogs } from './entities/error-logs.entity';

@Module({
  providers: [GlobalService],
  imports: [SequelizeModule.forFeature([ErrorLogs])],
  exports: [GlobalService],
})
export class GlobalModule {}
