import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UploadsService {
  constructor(private prisma: PrismaService) {}

  async saveAttachment(ticketId: string, file: Express.Multer.File) {
    return this.prisma.attachment.create({
      data: {
        ticketId,
        nomeArquivo: file.originalname,
        url: `/uploads/${file.filename}`,
        tamanho: file.size,
        mimeType: file.mimetype,
      },
    });
  }
}
