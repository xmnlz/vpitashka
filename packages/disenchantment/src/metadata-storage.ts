import { type RESTPostAPIChatInputApplicationCommandsJSONBody } from "discord.js";
import { type SimpleCommand } from "./command.js";
import { type OptionsMap } from "./option.js";

export class MetadataStorage {
  private static _instance: MetadataStorage;
  private _simpleCommandMap: Map<string, SimpleCommand<OptionsMap>> = new Map();
  private _commandJsonBodies: RESTPostAPIChatInputApplicationCommandsJSONBody[] =
    [];

  static get instance(): MetadataStorage {
    if (!this._instance) {
      this._instance = new MetadataStorage();
    }
    return this._instance;
  }

  get commandJsonBodies() {
    return this._commandJsonBodies;
  }

  get simpleCommandMap() {
    return this._simpleCommandMap;
  }

  setCommandJsonBodies(
    commands: RESTPostAPIChatInputApplicationCommandsJSONBody[],
  ) {
    this._commandJsonBodies = commands;
  }

  setSimpleCommandMap(map: Map<string, SimpleCommand<OptionsMap>>) {
    this._simpleCommandMap = map;
  }
}
