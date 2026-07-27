import { BadRequestException, Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: process.env.UPLOADS_DIR || './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
      fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
          'image/jpeg',
          'image/png',
          'image/webp',
          'application/pdf',
          'text/plain',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];
        if (allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Tipo de arquivo não permitido (apenas imagens e documentos são suportados).'), false);
        }
      },
    }),
  ],
  controllers: [UploadsController],
  providers: [UploadsService],
})
export class UploadsModule {}
