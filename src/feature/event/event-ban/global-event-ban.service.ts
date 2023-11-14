import { Snowflake } from 'discord.js';
import { injectable } from 'tsyringe';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { Database } from '../../../database/data-source.js';
import { Eventsmode } from '../../eventsmode/eventsmode.entity.js';
import { User } from '../../user/user.entity.js';
import { GlobalEventBan } from './global-event-ban.entity.js';

@injectable()
export class GlobalEventBanService {
  private globalEventBanRepository: Repository<GlobalEventBan>;
  private userRepository: Repository<User>;

  constructor(private readonly database: Database) {
    this.globalEventBanRepository = database.em.getRepository(GlobalEventBan);
    this.userRepository = database.em.getRepository(User);
  }

  @Transactional()
  async addGlobalBan(userId: Snowflake, guildId: Snowflake, reason: string) {
    const globalEventBan = await this.globalEventBanRepository.findOneBy({
      guild: { id: guildId },
      target: { userId, guild: { id: guildId } },
    });

    if (globalEventBan) return;

    let user = await this.userRepository.findOneBy({ userId, guild: { id: guildId } });

    if (!user) user = await this.userRepository.create({ userId, guild: { id: guildId } }).save();

    await this.globalEventBanRepository
      .create({ target: user, reason, guild: { id: guildId } })
      .save();
  }

  @Transactional()
  async removeGlobalBan(userId: Snowflake, guildId: Snowflake) {
    const globalEventBan = await this.globalEventBanRepository.findOneBy({
      guild: { id: guildId },
      target: { userId, guild: { id: guildId } },
    });

    if (globalEventBan) {
      await this.globalEventBanRepository.remove(globalEventBan);
    }
  }
}
