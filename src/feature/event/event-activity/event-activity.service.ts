import { injectable } from 'tsyringe';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { Database } from '../../../database/data-source.js';
import { Eventsmode } from '../../eventsmode/eventsmode.entity.js';
import { Guild } from '../../guild/guild.entity.js';
import { EventActivity } from './event-activity.entity.js';
import { Event } from '../event.entity.js';

interface CreateEventActivityProps {
  guildId: string;
  eventsmode: Eventsmode;
  textChannelId: string;
  voiceChannelId: string;
  event: Event;
}

@injectable()
export class EventActivityService {
  private eventActivityRepository: Repository<EventActivity>;

  constructor(private readonly database: Database) {
    this.eventActivityRepository = database.em.getRepository(EventActivity);
  }

  @Transactional()
  async addTime(eventActivityId: string, timeAmount: number) {
    const eventActivity = await this.eventActivityRepository.findOneBy({
      id: eventActivityId,
    });

    if (eventActivity) {
      await this.eventActivityRepository.update(eventActivityId, {
        eventTime: () => `eventTime + ${timeAmount}`,
      });
    }
  }

  @Transactional()
  async createEventActivity(props: CreateEventActivityProps) {
    const { event, eventsmode, textChannelId, voiceChannelId, guildId } = props;

    await this.eventActivityRepository
      .create({
        guild: { id: guildId },
        voiceChannelId,
        textChannelId,
        event,
        executor: eventsmode,
      })
      .save();
  }

  @Transactional()
  async startEventActivity(id: string) {
    await this.eventActivityRepository.update(
      { id },
      { isStared: true, startedAt: () => 'CURRENT_TIMESTAMP' },
    );
  }

  @Transactional()
  async pauseEventActivity(id: string, pause: boolean) {
    await this.eventActivityRepository.update({ id }, { isPaused: !pause });
  }

  @Transactional()
  async deleteEventActivity(id: string) {
    await this.eventActivityRepository.delete({ id });
  }
}
