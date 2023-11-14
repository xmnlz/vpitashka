import { injectable } from 'tsyringe';
import type { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { Database } from '../../database/data-source.js';
import { Guild } from './guild.entity.js';
import { SettingsManagementService } from './settings-management/settings-management.service.js';

@injectable()
export class GuildService {
  private guildRepository: Repository<Guild>;
  private roleManagementService: SettingsManagementService;

  constructor(
    private readonly database: Database,
    private readonly roleManagement: SettingsManagementService,
  ) {
    this.guildRepository = database.em.getRepository(Guild);
    this.roleManagementService = roleManagement;
  }

  @Transactional()
  async registerGuild(guildId: string) {
    const guild = await this.guildRepository.findOneBy({ id: guildId });

    if (!guild) {
      await this.createGuild(guildId);
    }

    await this.roleManagementService.createSettingsManagement(guildId);
  }

  @Transactional()
  async createGuild(guildId: string) {
    await this.guildRepository.create({ id: guildId }).save();
  }
}
