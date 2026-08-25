import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { extname, basename, join } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { StorageService } from '../src/storage/storage.service';

const prisma = new PrismaClient();
const storageService = new StorageService();

const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

function getMimeType(filename: string): string {
  return MIME_TYPES[extname(filename).toLowerCase()] ?? 'application/octet-stream';
}

async function main() {
  const films = await prisma.film.findMany({
    where: {
      posterUrl: {
        startsWith: '/assets/images/',
      },
    },
    orderBy: { id: 'asc' },
  });

  if (!films.length) {
    console.log('No local poster URLs found. Nothing to migrate.');
    return;
  }

  console.log(`Found ${films.length} film(s) with local posters.`);

  for (const film of films) {
    const filename = basename(film.posterUrl);
    const localPath = join(process.cwd(), 'public', 'assets', 'images', filename);
    const buffer = await readFile(localPath);
    const mimeType = getMimeType(filename);
    const posterUrl = await storageService.uploadBuffer(
      buffer,
      filename,
      mimeType,
      'films/legacy',
    );

    await prisma.film.update({
      where: { id: film.id },
      data: { posterUrl },
    });

    console.log(`Migrated film #${film.id} "${film.title}" -> ${posterUrl}`);
  }
}

main()
  .catch((error) => {
    console.error('Failed to migrate posters:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
