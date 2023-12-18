import { injectable } from 'tsyringe';
import { Repository } from 'typeorm';
import { Database } from '../../../database/data-source.js';
import { Eventsmode } from '../../eventsmode/eventsmode.entity.js';
import { GlobalEventHistory } from './global-event-history.entity.js';
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
export class GlobalEventHistoryService {
  private globalEventHistoryRepository: Repository<GlobalEventHistory>;

  constructor(private readonly database: Database) {
    this.globalEventHistoryRepository = database.em.getRepository(GlobalEventHistory);
  }

  async addGlobalEventHistory(props: EventHistoryProps) {
    await this.globalEventHistoryRepository
      .create({ ...props, endedAt: new Date().toISOString() })
      .save();
  }
}
