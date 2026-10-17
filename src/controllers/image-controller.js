import fs from 'node:fs';
import path from 'node:path';
import { Buffer } from 'node:buffer';
import multer from 'multer';
import convert from 'heic-convert';
import { BaseController } from './base-controller.js';
import { HTTP_STATUS } from '#constants';
import { BadRequestException } from '#exceptions';

export const UPLOAD_DIR =
  process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif'];
const HEIC_EXTENSIONS = ['.heic', '.heif'];

try {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
} catch {}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { files: 1, fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const isAllowed =
      ALLOWED_EXTENSIONS.includes(ext) || HEIC_EXTENSIONS.includes(ext);
    if (isAllowed) cb(null, true);
    else
      cb(
        new BadRequestException(
          'JPG, PNG, WEBP, GIF, AVIF, HEIC 이미지만 업로드할 수 있어요',
        ),
      );
  },
});

async function toUploadBuffer(file) {
  const ext = path.extname(file.originalname || '').toLowerCase();

  if (!HEIC_EXTENSIONS.includes(ext)) {
    return { buffer: file.buffer, ext };
  }

  try {
    const converted = await convert({ buffer: file.buffer, format: 'JPEG' });
    return { buffer: Buffer.from(converted), ext: '.jpg' };
  } catch {
    throw new BadRequestException(
      'HEIC 이미지를 변환하지 못했어요. JPG 또는 PNG로 올려주세요',
    );
  }
}

export class ImageController extends BaseController {
  routes() {
    this.router.post('/upload', upload.single('image'), async (req, res, next) => {
      try {
        if (!req.file) {
          throw new BadRequestException('업로드할 이미지를 선택해 주세요');
        }

        const { buffer, ext } = await toUploadBuffer(req.file);
        const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

        await fs.promises.writeFile(path.join(UPLOAD_DIR, filename), buffer);

        return res.status(HTTP_STATUS.CREATED).json({
          success: true,
          data: { url: `/uploads/${filename}` },
        });
      } catch (error) {
        return next(error);
      }
    });

    return this.router;
  }
}
