import { Snowflake } from 'discord.js';
import { injectable } from 'tsyringe';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { Database } from '../../../database/data-source.js';
import { Eventsmode } from '../../eventsmode/eventsmode.entity.js';
import { User } from '../../user/user.entity.js';
import { EventBan } from './event-ban.entity.js';

@injectable()
export class EventBanService {
  private eventBanRepository: Repository<EventBan>;
  private eventsmodeRepository: Repository<Eventsmode>;
  private userRepository: Repository<User>;

  constructor(private readonly database: Database) {
    this.eventBanRepository = database.em.getRepository(EventBan);
    this.eventsmodeRepository = database.em.getRepository(Eventsmode);
    this.userRepository = database.em.getRepository(User);
  }

  @Transactional()
  async addTemporaryBan(props: {
    guildId: Snowflake;
    executorId: Snowflake;
    targetId: Snowflake;
    days: number;
    reason: string;
  }) {
    const { guildId, executorId, targetId, reason, days } = props;
    const eventBan = await this.eventBanRepository.findOneBy({
      executor: { userId: executorId, guild: { id: guildId } },
      target: { userId: targetId, guild: { id: guildId } },
    });

    if (eventBan) return;

    const eventsmode = await this.eventsmodeRepository.findOneBy({
      guild: { id: guildId },
      userId: executorId,
      isHired: true,
    });

    if (eventsmode) {
      let user = await this.userRepository.findOneBy({ userId: targetId, guild: { id: guildId } });

      if (!user)
        user = await this.userRepository
          .create({ userId: targetId, guild: { id: guildId } })
          .save();

      await this.eventBanRepository
        .create({ executor: eventsmode, target: user, reason, days, guild: { id: guildId } })
        .save();
    }
  }

  @Transactional()
  async removeTemporaryBan(props: {
    guildId: Snowflake;
    executorId: Snowflake;
    targetId: Snowflake;
  }) {
    const { guildId, executorId, targetId } = props;

    const eventBan = await this.eventBanRepository.findOneBy({
      guild: { id: guildId },
      executor: { userId: executorId, guild: { id: guildId } },
      target: { userId: targetId, guild: { id: guildId } },
    });

    if (eventBan) {
      await this.eventBanRepository.remove(eventBan);
    }
  }
}
