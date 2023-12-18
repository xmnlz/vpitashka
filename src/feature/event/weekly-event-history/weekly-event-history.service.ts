import { injectable } from 'tsyringe';
import { Repository } from 'typeorm';
import { Database } from '../../../database/data-source.js';
import { Eventsmode } from '../../eventsmode/eventsmode.entity.js';
import { WeeklyEventHistory } from './weekly-event-history.entity.js';
import { Event } from '../event.entity.js';

interface EventHistoryProps {
  event: Event;
  eventsmode: Eventsmode;
  totalTime: number;
  totalSalary: number;
  startedAt: Date;
  guild: { id: string };
}

@injectable()
export class WeeklyEventHistoryService {
  private weeklyEventHistoryRepository: Repository<WeeklyEventHistory>;

  constructor(private readonly database: Database) {
    this.weeklyEventHistoryRepository = database.em.getRepository(WeeklyEventHistory);
  }

  async addWeeklyEventHistory(props: EventHistoryProps) {
    await this.weeklyEventHistoryRepository
      .create({ ...props, endedAt: new Date().toISOString() })
      .save();
  }
}
