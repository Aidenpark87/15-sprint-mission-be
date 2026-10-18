#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/1bce3ff41ff79164dc545541cd79ee6f033d4b02ba937a110f1298b0211fa6ce/contract';
import startContract from '../../snapshots/1bce3ff41ff79164dc545541cd79ee6f033d4b02ba937a110f1298b0211fa6ce/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/98118c36ade48027f001c39ab5a46f36428b3fb9dc109f5b2339984d5dfe393c/contract';
import endContract from '../../snapshots/98118c36ade48027f001c39ab5a46f36428b3fb9dc109f5b2339984d5dfe393c/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, primaryKey, sql } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'SocialAccount',
        columns: [
          col('createdAt', 'timestamp(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 3 } },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('provider', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('providerId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamp(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 3 } },
          }),
          col('userId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'], { name: 'SocialAccount_pkey' })],
      }),
      this.createIndex({
        schema: 'public',
        table: 'SocialAccount',
        index: 'SocialAccount_provider_providerId_key',
        columns: ['provider', 'providerId'],
        extras: { unique: true },
      }),
      this.createIndex({
        schema: 'public',
        table: 'SocialAccount',
        index: 'SocialAccount_userId_idx',
        columns: ['userId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'SocialAccount',
        foreignKey: {
          name: 'SocialAccount_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'User', columns: ['id'] },
          onDelete: 'cascade',
          onUpdate: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
