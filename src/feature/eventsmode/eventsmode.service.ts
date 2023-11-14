import { injectable } from 'tsyringe';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { Database } from '../../database/data-source.js';
import { EventHistory } from '../event/event-history/event-history.entity.js';
import { Eventsmode, StaffRole } from './eventsmode.entity.js';

interface EventsmodeStatistics {
  totalTime?: number;
  totalSalary?: number;
  weeklyTime?: number;
  weeklySalary?: number;
  favoriteEvent?: string;
  longestEvent?: number;
  hearts?: number;
}

@injectable()
export class EventsmodeService {
  private eventsmodeRepository: Repository<Eventsmode>;
  private eventHistoryRepository: Repository<EventHistory>;

  constructor(private readonly database: Database) {
    this.eventsmodeRepository = database.em.getRepository(Eventsmode);
    this.eventHistoryRepository = database.em.getRepository(EventHistory);
  }

  @Transactional()
  async createEventsmode(userId: string, guildId: string) {
    const eventsmode = await this.eventsmodeRepository.findOneBy({
      userId,
      guild: { id: guildId },
    });

    if (!eventsmode) {
      await this.eventsmodeRepository.create({ guild: { id: guildId }, userId }).save();
      return;
    }

    await this.eventsmodeRepository.update({ guild: { id: guildId }, userId }, { isHired: true });
  }

  @Transactional()
  async removeEventsmode(userId: string, guildId: string) {
    const eventsmode = await this.eventsmodeRepository.findOneBy({
      userId,
      guild: { id: guildId },
    });

    if (eventsmode)
      await this.eventsmodeRepository.update(
        { userId, guild: { id: guildId } },
        { isHired: false },
      );
  }

  @Transactional()
  async assentEventsmode(userId: string, guildId: string, staffRole: StaffRole) {
    const eventsmode = await this.eventsmodeRepository.findOneBy({
      userId,
      guild: { id: guildId },
    });

    if (!eventsmode) {
      await this.eventsmodeRepository.create({ guild: { id: guildId }, userId, staffRole }).save();
      return;
    }

    await this.eventsmodeRepository.update({ userId, guild: { id: guildId } }, { staffRole });
  }

  @Transactional()
  async editStatistics(userId: string, guildId: string, stats: EventsmodeStatistics) {
    const {
      totalTime,
      totalSalary,
      weeklyTime,
      weeklySalary,
      hearts,
      longestEvent,
      favoriteEvent,
    } = stats;
    await this.eventsmodeRepository.update(
      { userId, guild: { id: guildId } },
      {
        totalTime: () => (totalTime ? `total_time + ${totalTime}` : `total_time`),
        totalSalary: () => (totalSalary ? `total_salary + ${totalSalary}` : `total_salary`),
        weeklyTime: () => (weeklyTime ? `weekly_time + ${weeklyTime}` : `weekly_time`),
        weeklySalary: () => (weeklySalary ? `weekly_salary + ${weeklySalary}` : `weekly_salary`),
        longestEvent: () => (longestEvent ? `${longestEvent}` : `longest_event`),
        favoriteEvent: () => (favoriteEvent ? favoriteEvent : `favorite_event`),
        hearts: () => (hearts ? `${hearts}` : `hearts`),
      },
    );
  }

  @Transactional()
  async resetWeekly(guildId: string) {
    const eventsmode = await this.eventsmodeRepository.findBy({
      guild: { id: guildId },
      isHired: true,
    });

    for (const { id } of eventsmode) {
      const favoriteEvent = await this.eventHistoryRepository.query(
        `
            SELECT name FROM (
            SELECT event.name, COUNT(event.name) AS count
            FROM public.event_history
            LEFT JOIN event ON event.id=event_id
            LEFT JOIN eventsmode ON eventsmode.id = eventsmode_id
            WHERE eventsmode.id = $1
            GROUP BY event.name
            ORDER BY count DESC LIMIT 1) as x
      `,
        [id],
      );

      await this.eventsmodeRepository.update(
        { id },
        { weeklyTime: 0, weeklySalary: 0, favoriteEvent: favoriteEvent[0]?.name || 'vorerst leer' },
      );
    }
  }
}
