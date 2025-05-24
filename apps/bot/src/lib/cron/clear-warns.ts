import { Cron } from "croner";

import { and, eq, lt } from "drizzle-orm";
import { db } from "../../database/database";
import { warn } from "../../schemas/warn";

export const clearOldWarnsCron = new Cron("0 0 */3 * *", async () => {
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  console.log("STARTED!");

  await db
    .delete(warn)
    .where(and(eq(warn.isVerbal, true), lt(warn.warnedAt, fourteenDaysAgo)));
});
