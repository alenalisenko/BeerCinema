import 'multer';
import { Injectable } from '@nestjs/common';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

@Injectable()
export class StorageService {
  private readonly s3 = new S3Client({
    endpoint: 'https://storage.yandexcloud.net',
    region: 'ru-central1',
    credentials: {
      accessKeyId: process.env.YANDEX_ACCESS_KEY_ID!,
      secretAccessKey: process.env.YANDEX_SECRET_ACCESS_KEY!,
    },
  });

  private readonly bucket = process.env.YANDEX_BUCKET!;

  async upload(file: Express.Multer.File): Promise<string> {
    const ext = file.originalname.split('.').pop();
    const key = `films/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    await new Upload({
      client: this.s3,
      params: {
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read',
      },
    }).done();

    return `https://${this.bucket}.storage.yandexcloud.net/${key}`;
  }
}
