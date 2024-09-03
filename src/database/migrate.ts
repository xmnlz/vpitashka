import { sql } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import * as path from 'path';
import { db } from './data-source';

export const runDrizzleMigration = () => {
  db.execute(sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`).then((r) =>
    console.log('Successfully created extension uuid-ossp'),
  );

  migrate(db, { migrationsFolder: path.join('./drizzle') })
    .then(() => console.log('Successfully ran migrations'))
    .catch((err) => console.log(err));
  // .finally(() => pool.end());
};
