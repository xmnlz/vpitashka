import { inlineCode, Snowflake, User, userMention } from 'discord.js';
import moment from 'moment';

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
  const now = moment();
  now.set({ hour: 19, minute: 0, second: 0, millisecond: 0 });

  if (now.hour() < 19) {
    now.subtract(1, 'week').startOf('week').add(19, 'hours');
  } else {
    now.startOf('week').add(19, 'hours');
  }

  const endOfWeek = now.clone().add(7, 'days');

  return [now.toDate(), endOfWeek.toDate()];
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
