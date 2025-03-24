import { EventBuilder } from "disenchantment/src";

const onReadyEvent = new EventBuilder("ready").setHandler(([client]) => {
  console.log("BOT IS READY??", client.isReady);
  console.log("BOT IS RUNNING!");
});
