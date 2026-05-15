import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    // Prisma 7 requiere un driver adapter explícito para SQLite.
    // PrismaBetterSqlite3 envuelve el driver nativo better-sqlite3 para Prisma.
    // La URL del env tiene formato "file:./dev.db" — la pasamos tal cual al adapter.
    const url = process.env.DATABASE_URL ?? 'file:./prisma/dev.db';
    const adapter = new PrismaBetterSqlite3({ url });
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
