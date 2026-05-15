import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { extname, join } from 'path';

type UploadFolder = 'evidences' | 'backups';

@Injectable()
export class StorageService {
  private readonly uploadDir = join(process.cwd(), 'src', 'uploads');
  private readonly s3Client?: S3Client;
  private readonly bucket?: string;
  private readonly region?: string;
  private readonly evidencePrefix: string;
  private readonly backupPrefix: string;

  constructor(private readonly configService: ConfigService) {
    this.bucket = this.configService.get<string>('AWS_S3_BUCKET');
    this.region = this.configService.get<string>('AWS_REGION');
    this.evidencePrefix =
      this.configService.get<string>('AWS_S3_EVIDENCE_PREFIX') ?? 'evidences';
    this.backupPrefix =
      this.configService.get<string>('AWS_S3_BACKUP_PREFIX') ?? 'backups';

    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');

    if (this.bucket && this.region && accessKeyId && secretAccessKey) {
      this.s3Client = new S3Client({
        region: this.region,
        credentials: { accessKeyId, secretAccessKey },
      });
    }
  }

  async saveImage(file: Express.Multer.File) {
    return this.uploadBuffer({
      buffer: file.buffer,
      contentType: file.mimetype,
      extension: extname(file.originalname || '') || '.jpg',
      folder: 'evidences',
    });
  }

  async saveBackup(content: string) {
    return this.uploadBuffer({
      buffer: Buffer.from(content, 'utf8'),
      contentType: 'application/json',
      extension: '.json',
      folder: 'backups',
    });
  }

  private async uploadBuffer(input: {
    buffer: Buffer;
    contentType: string;
    extension: string;
    folder: UploadFolder;
  }) {
    const fileName = `${randomUUID()}${input.extension}`;
    const folderPrefix =
      input.folder === 'backups' ? this.backupPrefix : this.evidencePrefix;
    const key = `${folderPrefix}/${fileName}`;

    if (this.s3Client && this.bucket && this.region) {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: input.buffer,
          ContentType: input.contentType,
        }),
      );

      return {
        provider: 's3',
        key,
        fileName,
        url: `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`,
      };
    }

    const localFolder = join(this.uploadDir, input.folder);
    await mkdir(localFolder, { recursive: true });
    await writeFile(join(localFolder, fileName), input.buffer);

    const backendUrl =
      this.configService.get<string>('BACKEND_URL') ??
      `http://localhost:${this.configService.get<string>('PORT', '3001')}`;

    return {
      provider: 'local',
      key,
      fileName,
      url: `${backendUrl}/uploads/${input.folder}/${fileName}`,
    };
  }
}
