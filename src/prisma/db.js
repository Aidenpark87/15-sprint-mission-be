import { Pool } from 'pg';
import { attachDatabasePool } from '@vercel/functions';
import { config } from '#config';
import { PrismaClient } from '#generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: config.DATABASE_URL });

if (process.env.VERCEL) {
  attachDatabasePool(pool);
}

const adapter = new PrismaPg(pool);

export const db = new PrismaClient({
  adapter,
});
