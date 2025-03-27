import { Options } from "multer-storage-cloudinary";

export declare interface cloudinaryOptions extends Options {
  params: {
    folder: string
    allowed_formats: string[]
  }
}