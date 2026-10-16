import { flattenError, z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().int().min(1000).max(65535).default(5001),
  DATABASE_URL: z
    .url()
    .refine(
      (url) => url.startsWith('postgresql:'),
      'PostgreSQL 연결 URL이어야 합니다.',
    ),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET은 32자 이상이어야 합니다.'),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().optional(),
});

const parseEnvironment = () => {
  try {
    return envSchema.parse({
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      DATABASE_URL: process.env.DATABASE_URL,
      JWT_SECRET: process.env.JWT_SECRET,
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('환경 변수 검증 실패:', flattenError(error));
    }
    throw error;
  }
};

export const config = parseEnvironment();
export const isDevelopment = config.NODE_ENV === 'development';
export const isProduction = config.NODE_ENV === 'production';
export const isTest = config.NODE_ENV === 'test';
