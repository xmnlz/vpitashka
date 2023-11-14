import { EmbedBuilder } from 'discord.js';
import { Colors } from './constants.js';
import { interpolate } from './log-formatter.js';

export const embedResponse = (props: {
  template: string;
  replaceArgs?: string[];
  status?: number;
  ephemeral?: boolean;
}) => {
  const { template, replaceArgs, ephemeral, status } = props || {};

  const dangerEmbed = new EmbedBuilder()
    .setColor(status || Colors.INFO)
    .setDescription(interpolate(template, replaceArgs || []))
    .setTimestamp();

  return { embeds: [dangerEmbed], ephemeral: ephemeral || false };
};
