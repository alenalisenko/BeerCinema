import 'multer';
import { Injectable } from '@nestjs/common';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

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

  async uploadBuffer(
    buffer: Buffer,
    originalName: string,
    contentType: string,
    keyPrefix = 'films',
  ): Promise<string> {
    const ext = originalName.split('.').pop();
    const key = `${keyPrefix}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );

    return `https://${this.bucket}.storage.yandexcloud.net/${key}`;
  }

  private getManagedObjectKey(url?: string | null): string | null {
    if (!url) return null;

    const virtualHostedPrefix = `https://${this.bucket}.storage.yandexcloud.net/`;
    if (url.startsWith(virtualHostedPrefix)) {
      return decodeURIComponent(url.slice(virtualHostedPrefix.length));
    }

    const pathStylePrefix = `https://storage.yandexcloud.net/${this.bucket}/`;
    if (url.startsWith(pathStylePrefix)) {
      return decodeURIComponent(url.slice(pathStylePrefix.length));
    }

    return null;
  }

  async upload(file: Express.Multer.File): Promise<string> {
    return this.uploadBuffer(
      file.buffer,
      file.originalname,
      file.mimetype,
      'films',
    );
  }

  async deleteByUrl(url?: string | null): Promise<boolean> {
    const key = this.getManagedObjectKey(url);
    if (!key) return false;

    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );

    return true;
  }
}
