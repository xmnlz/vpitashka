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
  const startOfTheWeek = moment().startOf('week');
  return [
    moment().startOf('week').toDate(),
    startOfTheWeek.add(6, 'days').add(19, 'hours').toDate(),
  ];
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
