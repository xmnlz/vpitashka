import { Snowflake } from 'discord.js';
import { injectable } from 'tsyringe';
import { Column, Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { Database } from '../../../database/data-source.js';
import { SettingsManagement } from './settings-management.entity.js';

interface RoleObject {
  eventsmodeRoleId: Snowflake;
  coachRoleId: Snowflake;
  curatorRoleId: Snowflake;
  moderatorRoleId: Snowflake;
  adminRoleId: Snowflake;
}

interface ChannelsObject {
  eventsmodeCategoryId: Snowflake;
  startedEventCategoryId?: Snowflake;
  announceEventChannelId?: Snowflake;
}

@injectable()
export class SettingsManagementService {
  private settingsManagementRepository: Repository<SettingsManagement>;

  constructor(private readonly database: Database) {
    this.settingsManagementRepository = database.em.getRepository(SettingsManagement);
  }

  @Transactional()
  async createSettingsManagement(guildId: string) {
    const settingsManagement = await this.settingsManagementRepository.findOneBy({
      guild: { id: guildId },
    });

    if (!settingsManagement) {
      await this.settingsManagementRepository.create({ guild: { id: guildId } }).save();
    }
  }

  @Transactional()
  async createOrUpdateRoles(guildId: string, roles: RoleObject) {
    const settingsManagement = await this.settingsManagementRepository.findOneBy({
      guild: { id: guildId },
    });

    if (settingsManagement) {
      await this.settingsManagementRepository.update(
        { guild: { id: guildId } },
        { ...roles, isRolesConfigured: true },
      );
    }
  }

  @Transactional()
  async createOrUpdateChannels(guildId: string, channels: ChannelsObject) {
    const settingsManagement = await this.settingsManagementRepository.findOneBy({
      guild: { id: guildId },
    });

    if (settingsManagement) {
      await this.settingsManagementRepository.update(
        { guild: { id: guildId } },
        { ...channels, isChannelConfigured: true },
      );
    }
  }

  @Transactional()
  async toggleStartedEventCategory(guildId: string, toggle: boolean) {
    await this.settingsManagementRepository.update(
      { guild: { id: guildId } },
      { isStartedEventCategory: toggle },
    );
  }

  @Transactional()
  async toggleEventAnnounce(guildId: string, toggle: boolean) {
    await this.settingsManagementRepository.update(
      { guild: { id: guildId } },
      { isEventAnnounce: toggle },
    );
  }

  @Transactional()
  async updateMinimumWeeklyQuota(guildId: string, minutes: number) {
    await this.settingsManagementRepository.update(
      { guild: { id: guildId } },
      { minimumWeeklyQuota: minutes },
    );
  }
}
