import { injectable } from 'tsyringe';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { Database } from '../../database/data-source.js';
import { Event } from './event.entity.js';

interface CreateEventProps {
  guildId: string;
  eventName: string;
  eventCategory: string;
  eventMultiplayer: number;
  eventStartEmbed: string;
  eventAnnounceEmbed: string;
}

@injectable()
export class EventService {
  private eventRepository: Repository<Event>;

  constructor(private readonly database: Database) {
    this.eventRepository = database.em.getRepository(Event);
  }

  @Transactional()
  async createEvent({
    guildId,
    eventName,
    eventCategory,
    eventMultiplayer,
    eventStartEmbed,
    eventAnnounceEmbed,
  }: CreateEventProps) {
    await this.eventRepository
      .create({
        guild: { id: guildId },
        name: eventName,
        category: eventCategory,
        multiplayer: eventMultiplayer,
        startEmbed: eventStartEmbed,
        announcedEmbed: eventAnnounceEmbed,
      })
      .save();
  }

  @Transactional()
  async updateEvent(guildId: string, eventId: string, filed: string, value: string | number) {
    // const value = typeof rawValue === 'number' ? floarawValue) : rawValue;

    await Event.update(
      { guild: { id: guildId }, id: eventId },
      {
        [filed]: value,
      },
    );
  }

  @Transactional()
  async removeEvent(guildId: string, eventName: string, eventCategory: string) {
    await Event.delete({ guild: { id: guildId }, name: eventName, category: eventCategory });
  }
}
