import { Module, Global, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

export const DRIZZLE = Symbol('DRIZZLE');
export type DrizzleDB = NodePgDatabase<typeof schema>;

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE,
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const logger = new Logger('Database');
        const connectionString = config.get<string>('DATABASE_URL');

        if (!connectionString) {
          logger.warn('DATABASE_URL not set, database features will not work');
          return null;
        }

        const pool = new Pool({ connectionString });
        const db = drizzle(pool, { schema });

        logger.log('Database connection established');
        return db;
      },
    },
  ],
  exports: [DRIZZLE],
})
export class DatabaseModule {}
