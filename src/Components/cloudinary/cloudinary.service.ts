import { Injectable, Inject } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor(
    @Inject('CLOUDINARY') private readonly cloudinaryClient: typeof cloudinary,
  ) {}

  async uploadImage(file: Express.Multer.File): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    this.cloudinaryClient.uploader
      .upload_stream(
        {
          folder: 'TicXpress',
          resource_type: 'image',
        },
        (error, result) => {
          if (error) return reject(error);

          if (!result) {
            return new Error('Cloudinary upload failed: no result returned');
          }

          resolve(result);
        },
      )
      .end(file.buffer);
  });
}
}
