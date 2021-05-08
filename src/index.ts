import { config as configEnv } from "dotenv";
configEnv();
import Discord from "discord.js";
import { initializeVoice } from "./states/talk";

const client = new Discord.Client();

client.on("ready", () => {
  console.log(`Logged in as ${client.user?.tag}!`);
});

client.on("message", (msg) => {
  const { content } = msg;
  if (content === "!buddy") {
    if (msg.member?.voice.channel) {
      msg.member.voice.channel.join().then(initializeVoice);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
