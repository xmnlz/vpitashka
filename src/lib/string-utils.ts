import { inlineCode, type Snowflake, User, userMention } from 'discord.js';

export const userWithNameAndId = (user: User, withInlineCode: boolean = true) => {
  if (!withInlineCode) return `${user.username} (${user.id})`;

  return inlineCode(`${user.username} (${user.id})`);
};

export const userWithMentionAndId = (userId: Snowflake) => {
  return userMention(userId) + inlineCode(`(${userId})`);
};

export const interpolate = (string: string, params: (string | number)[]) => {
  return string.replace(/\$(\d+)/g, (_, num) => `${params[Number(num) - 1]}`);
};

export const permissionToString = (staffRole: number) => {
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
    case 6:
      return 'Developer';

    default:
      return staffRole >= 100 ? 'Root' : 'Unknown';
  }
};
