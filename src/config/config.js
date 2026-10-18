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
  OAUTH_STATE_SECRET: z
    .string()
    .min(32, 'OAUTH_STATE_SECRET은 32자 이상이어야 합니다.'),
  CORS_ORIGINS: z.string().optional().default(''),
  API_BASE_URL: z.string().optional().default(''),
  CLIENT_BASE_URL: z.string().optional().default('http://localhost:3000'),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  KAKAO_CLIENT_ID: z.string().optional(),
  KAKAO_CLIENT_SECRET: z.string().optional(),
});

const parseEnvironment = () => {
  try {
    const parsed = envSchema.parse({
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      DATABASE_URL: process.env.DATABASE_URL,
      JWT_SECRET: process.env.JWT_SECRET,
      OAUTH_STATE_SECRET: process.env.OAUTH_STATE_SECRET,
      CORS_ORIGINS: process.env.CORS_ORIGINS,
      API_BASE_URL: process.env.API_BASE_URL,
      CLIENT_BASE_URL: process.env.CLIENT_BASE_URL,
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
      KAKAO_CLIENT_ID: process.env.KAKAO_CLIENT_ID,
      KAKAO_CLIENT_SECRET: process.env.KAKAO_CLIENT_SECRET,
    });

    return {
      ...parsed,
      API_BASE_URL:
        parsed.API_BASE_URL || `http://localhost:${String(parsed.PORT)}`,
    };
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

export const corsOrigins = config.CORS_ORIGINS.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
