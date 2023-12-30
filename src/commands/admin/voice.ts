import {ApplicationCommandOptionType, ChannelType, CommandInteraction, VoiceChannel} from 'discord.js';
import { Discord, Guard, Slash, SlashGroup, SlashOption } from 'discordx';
import { AdministratorGuard } from "../../guards/administrator.guard.js";
import { getVoiceConnections, joinVoiceChannel } from "@discordjs/voice";

@Discord()
@Guard(AdministratorGuard)
@SlashGroup({ description: "Voice connection management", name: "voice" })
export class Command {
    @SlashGroup("voice")
    @Slash({ description: "Connection to the selected voice channel" })
    async connection(
        @SlashOption({
            description: "Select any voice channel to connect",
            name: "voice",
            required: true,
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [ChannelType.GuildVoice],
        })
        channel: VoiceChannel,
        ctx: CommandInteraction<'cached'>
    ) {
        await ctx.deferReply();

        if (channel) {
            joinVoiceChannel({
                channelId: channel.id,
                guildId: ctx.guild.id,
                adapterCreator: ctx.guild.voiceAdapterCreator,
                selfDeaf: false,
                selfMute: false,
            });
        } else {
            if (!ctx.member.voice.channel) {
                await ctx.editReply({ content: '# Moscow, Istanbul, Oslo, Paris.' });
                return;
            }

            joinVoiceChannel({
                channelId: ctx.member.voice.channel.id,
                guildId: ctx.guild.id,
                adapterCreator: ctx.guild.voiceAdapterCreator,
                selfDeaf: false,
                selfMute: false,
            });
        }

        await ctx.editReply(
            "# Enfants Riches Déprimés"
        );
    }
    @SlashGroup("voice")
    @Slash({ description: "Forced disconnection from the voice channel" })
    async disconnection(ctx: CommandInteraction<'cached'>) {
        await ctx.deferReply();

        const connection = getVoiceConnections(ctx.guild.id);

        if (!connection) {
            await ctx.editReply("# Moscow, Istanbul, Oslo, Paris.");
            return;
        }

        for (const [_, voice] of connection) {
            voice.disconnect();
        }

        await ctx.editReply(
            "# Enfants Riches Déprimés"
        );
    }
}
