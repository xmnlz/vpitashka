import { env } from 'process';
import { singleton } from 'tsyringe';
import { DataSource, EntityManager } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { addTransactionalDataSource, initializeTransactionalContext } from 'typeorm-transactional';
import { dirname } from '@discordx/importer';
import { logger } from '../lib/logger.js';

@singleton()
class Database {
  private AppDataSource: DataSource;

  public get dataSource(): DataSource {
    return this.AppDataSource;
  }

  public get em(): EntityManager {
    return this.AppDataSource.manager;
  }

  public connect() {
    initializeTransactionalContext();

    this.AppDataSource = new DataSource({
      type: 'postgres',
      host: env.DATABASE_HOST,
      port: Number(env.DATABASE_PORT),
      username: env.DATABASE_USER,
      password: env.DATABASE_PASS,
      database: env.DATABASE_NAME,
      synchronize: env.DATABASE_SYNCHRONIZE === 'true',
      logging: env.DATABASE_LOGGING === 'true',
      namingStrategy: new SnakeNamingStrategy(),
      entities: [dirname(import.meta.url) + '/../feature/**/*'],
      migrations: [],
    });

    this.AppDataSource.initialize()
      .then(() => {
        logger.info('[DB] Data Source has been initialized!');
      })
      .catch((err) => {
        logger.error('[DB] Error during Data Source initialization', err);
      });

    addTransactionalDataSource(this.AppDataSource);
  }
}

export { Database };
