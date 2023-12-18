import { inlineCode, Snowflake, User, userMention } from 'discord.js';
import moment from 'moment-timezone';

export const userWithNameAndId = (user: User) => {
  return inlineCode(`${user.username} (${user.id})`);
};

export const userWithMentionAndId = (userId: Snowflake) => {
  return userMention(userId) + inlineCode(`(${userId})`);
};

export const interpolate = (string: string, params: string[]) => {
  return string.replace(/\$(\d+)/g, (_, num) => params[num - 1]);
};

export const specialWeekInterval = () => {
  const today = moment().tz('Europe/Moscow');
  const dayOfWeek = today.day();

  const startOfThisWeek = today
    .clone()
    .subtract(dayOfWeek - 7, 'days')
    .startOf('day');

  const endOfNextWeek = startOfThisWeek.clone().add(7, 'days');

  return [startOfThisWeek.toDate(), endOfNextWeek.toDate()];
};

export const getStuffRole = (staffRole: number) => {
  switch (staffRole) {
    case 1:
      return 'Eventsmode';
    case 2:
      return 'Coach';
    case 3:
      return 'Curator';
    case 4:
      return 'Moderator';
    case 5:
      return 'Administrator';
    default:
      return 'Eventsmode';
  }
};
