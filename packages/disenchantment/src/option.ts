import {
  ApplicationCommandOptionType,
  GuildMember,
  Role,
  User,
  type Channel,
  TextChannel,
  VoiceChannel,
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
  ChannelType,
} from "discord.js";

export type Options =
  | OptionInterface<ApplicationCommandOptionType.String>
  | OptionInterface<ApplicationCommandOptionType.Integer>
  | OptionInterface<ApplicationCommandOptionType.Number>
  | OptionInterface<ApplicationCommandOptionType.Boolean>
  | OptionInterface<ApplicationCommandOptionType.User>
  | OptionInterface<ApplicationCommandOptionType.Channel>
  | OptionInterface<ApplicationCommandOptionType.Role>
  | OptionInterface<ApplicationCommandOptionType.Mentionable>
  | OptionInterface<ApplicationCommandOptionType.Attachment>;

interface ChoiceOption<T extends number | string> {
  name: string;
  value: T;
}

type StringChoice = ChoiceOption<string>;
type NumberChoice = ChoiceOption<number>;

interface StringOptionExtra {
  autocomplete?: boolean;
  choices?: StringChoice;
  maxLength?: number;
  minLength?: number;
}

interface IntegerOptionExtra {
  autocomplete?: boolean;
  choices?: NumberChoice;
  maxValue?: number;
  minValue?: number;
}

interface NumberOptionExtra {
  autocomplete?: boolean;
  choices?: NumberChoice;
  maxValue?: number;
  minValue?: number;
}

interface ChannelOptionExtra {
  channelTypes?: Exclude<
    ChannelType,
    ChannelType.GroupDM | ChannelType.DM | ChannelType.GuildDirectory
  >[];
}

type OptionExtra<T extends ApplicationCommandOptionType> =
  T extends ApplicationCommandOptionType.String
    ? StringOptionExtra
    : T extends ApplicationCommandOptionType.Integer
      ? IntegerOptionExtra
      : T extends ApplicationCommandOptionType.Number
        ? NumberOptionExtra
        : T extends ApplicationCommandOptionType.Channel
          ? ChannelOptionExtra
          : never;

export interface OptionInterface<
  T extends ApplicationCommandOptionType = ApplicationCommandOptionType,
  N extends string = string,
  R extends boolean = boolean,
> {
  name: N;
  description: string;
  type: T;
  required: R;
  extra?: OptionExtra<T>;
}

type Option = <
  T extends ApplicationCommandOptionType,
  N extends string,
  R extends boolean,
>(
  options: OptionInterface<T, N, R>,
) => OptionInterface<T, N, R>;

export const option: Option = (options) => {
  return options;
};

export type OptionsMap<T extends Record<string, OptionInterface> = {}> = {
  [K in keyof T]: T[K];
};

type OptionTypeMap = {
  [ApplicationCommandOptionType.String]: string;
  [ApplicationCommandOptionType.Integer]: number;
  [ApplicationCommandOptionType.Boolean]: boolean;
  [ApplicationCommandOptionType.User]: User;
  [ApplicationCommandOptionType.Channel]: Channel | VoiceChannel | TextChannel;
  [ApplicationCommandOptionType.Role]: Role;
  [ApplicationCommandOptionType.Mentionable]: User | Role | GuildMember;
  [ApplicationCommandOptionType.Number]: number;
};

export type OptionValue<T extends ApplicationCommandOptionType> =
  T extends keyof OptionTypeMap ? OptionTypeMap[T] : unknown;

export type ExtractArgs<T extends OptionsMap<any>> = {
  [K in keyof T]: T[K]["required"] extends true
    ? OptionValue<T[K]["type"]>
    : OptionValue<T[K]["type"]> | undefined;
};

/**
 * TODO: Reimplemnt SlahsCommandBuilder into my own wrapper to create my own json, to make it more convinient
 */
export function registerOption(
  builder: SlashCommandBuilder | SlashCommandSubcommandBuilder,
  opt: Options,
) {
  switch (opt.type) {
    case ApplicationCommandOptionType.String:
      return builder.addStringOption((option) => {
        option
          .setName(opt.name)
          .setDescription(opt.description)
          .setRequired(opt.required);

        // if (minLength && maxLength && minLength > maxLength) {
        //   throw new Error(
        //     maxLength can't be bigger then minLenght, ${minLength} !> ${maxLength},
        //   );
        // }

        if (opt.extra) {
          const { maxLength, minLength, autocomplete, choices } = opt.extra;

          if (maxLength) option.setMaxLength(maxLength);
          if (minLength) option.setMinLength(minLength);
          if (autocomplete) option.setAutocomplete(autocomplete);

          if (choices) {
            option.setAutocomplete(true);
            option.setChoices(choices);
          }
        }

        return option;
      });
    case ApplicationCommandOptionType.Integer:
      return builder.addIntegerOption((option) => {
        option
          .setName(opt.name)
          .setDescription(opt.description)
          .setRequired(opt.required);

        if (opt.extra) {
          const { minValue, maxValue, autocomplete, choices } = opt.extra;
          if (minValue) option.setMinValue(minValue);
          if (maxValue) option.setMaxValue(maxValue);
          if (autocomplete) option.setAutocomplete(autocomplete);

          if (choices) {
            option.setAutocomplete(true);
            option.setChoices(choices);
          }
        }

        return option;
      });

    case ApplicationCommandOptionType.Number:
      return builder.addNumberOption((option) => {
        option
          .setName(opt.name)
          .setDescription(opt.description)
          .setRequired(opt.required);

        if (opt.extra) {
          const { minValue, maxValue, autocomplete, choices } = opt.extra;
          if (minValue) option.setMinValue(minValue);
          if (maxValue) option.setMaxValue(maxValue);
          if (autocomplete) option.setAutocomplete(autocomplete);

          if (choices) {
            option.setAutocomplete(true);
            option.setChoices(choices);
          }
        }

        return option;
      });
    case ApplicationCommandOptionType.Boolean:
      return builder.addBooleanOption((option) =>
        option
          .setName(opt.name)
          .setDescription(opt.description)
          .setRequired(opt.required),
      );
    case ApplicationCommandOptionType.User:
      return builder.addUserOption((option) =>
        option
          .setName(opt.name)
          .setDescription(opt.description)
          .setRequired(opt.required),
      );
    case ApplicationCommandOptionType.Channel:
      return builder.addChannelOption((option) => {
        option
          .setName(opt.name)
          .setDescription(opt.description)
          .setRequired(opt.required);
        if (opt.extra) {
          const { channelTypes } = opt.extra;

          if (channelTypes) {
            option.addChannelTypes(channelTypes);
          }
        }

        return option;
      });
    case ApplicationCommandOptionType.Role:
      return builder.addRoleOption((option) =>
        option
          .setName(opt.name)
          .setDescription(opt.description)
          .setRequired(opt.required),
      );
    case ApplicationCommandOptionType.Mentionable:
      return builder.addMentionableOption((option) =>
        option
          .setName(opt.name)
          .setDescription(opt.description)
          .setRequired(opt.required),
      );
    case ApplicationCommandOptionType.Attachment:
      return builder.addAttachmentOption((option) =>
        option
          .setName(opt.name)
          .setDescription(opt.description)
          .setRequired(opt.required),
      );
    default:
      throw new Error(`Unsupported option type: ${opt}`);
  }
}
