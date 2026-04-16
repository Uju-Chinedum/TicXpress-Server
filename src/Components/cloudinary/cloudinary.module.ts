import { Module } from '@nestjs/common';

import { CloudinaryService } from './cloudinary.service';
import { v2 as cloudinary } from 'cloudinary';

@Module({
  providers: [
    CloudinaryService,
    {
      provide: 'CLOUDINARY',
      useValue: cloudinary,
    },
  ],
  exports: [CloudinaryService],
})
export class CloudinaryModule {}
