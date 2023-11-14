import { Snowflake } from 'discord.js';
import { injectable } from 'tsyringe';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { Database } from '../../database/data-source.js';
import { Eventsmode } from '../eventsmode/eventsmode.entity.js';
import { Warn } from './warn.entity.js';

@injectable()
export class WarnService {
  private warnRepository: Repository<Warn>;

  constructor(private readonly database: Database) {
    this.warnRepository = database.em.getRepository(Warn);
  }

  @Transactional()
  async addWarn(
    executorId: Snowflake,
    targetId: Snowflake,
    guildId: Snowflake,
    isVerbal: boolean | undefined,
    reason: string,
  ) {
    const executorEventsmode = await Eventsmode.findOneBy({
      userId: executorId,
      guild: { id: guildId },
      isHired: true,
    });

    const targetEventsmode = await Eventsmode.findOneBy({
      userId: targetId,
      guild: { id: guildId },
      isHired: true,
    });

    if (executorEventsmode && targetEventsmode) {
      await this.warnRepository
        .create({
          guild: { id: guildId },
          executor: executorEventsmode,
          target: targetEventsmode,
          reason,
          isVerbal: isVerbal || false,
        })
        .save();
    }
  }

  @Transactional()
  async removeWarn(warnId: string) {
    await this.warnRepository.delete({ id: warnId });
  }
}
