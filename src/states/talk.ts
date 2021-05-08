import { VoiceConnection, User } from "discord.js";
import { SpeechClient } from "@google-cloud/speech";
import { TextToSpeechClient } from "@google-cloud/text-to-speech";
import { createConversation } from "../manager/conversation";
import { createWriteStream, promises as fs } from "fs";
import { Readable } from "stream";
import { lastTaskQueuer } from "./../utils/tasks";

const speechClient = new SpeechClient();
const textToSpeechClient = new TextToSpeechClient();

export function initializeVoice(voice: VoiceConnection) {
  const channel = voice.channel;
  const conversation = createConversation();
  const speechQueuer = lastTaskQueuer();
  speechQueuer.start();
  channel.members.forEach((member) => {
    initializeUserVoice(voice, member.user, conversation, speechQueuer);
  });
}

export async function initializeUserVoice(
  voice: VoiceConnection,
  user: User,
  conversation: ReturnType<typeof createConversation>,
  speechQueuer: ReturnType<typeof lastTaskQueuer>
) {
  do {
    try {
      const tmpFileName = `/tmp/${Date.now() + Math.random()}.pcm`;
      const stream = voice.receiver.createStream(user, {
        end: "silence",
        mode: "pcm",
      });
      stream.pipe(createWriteStream(tmpFileName));
      await new Promise((res) => stream.on("end", res));
      const [textData, req] = await speechClient.recognize({
        config: {
          encoding: "LINEAR16",
          languageCode: "en-US",
          sampleRateHertz: 48000,
          audioChannelCount: 2,
        },
        audio: {
          content: await fs.readFile(tmpFileName),
        },
      });

      const question =
        textData.results
          ?.map((result) => result.alternatives?.[0].transcript)
          .join(";") || "";
      if (question) {
        console.log(`${user.username}: ${question}`);
        const textToPlay = await conversation.ask(question, user.username);
        if (textToPlay && textToPlay !== "\n") {
          console.log(`bot: ${textToPlay}`);
          await new Promise<void>((res) =>
            speechQueuer.queueTask(async () => {
              const [speechData] = await textToSpeechClient.synthesizeSpeech({
                input: { text: textToPlay },
                voice: { languageCode: "en-UK", ssmlGender: "FEMALE" },
                audioConfig: { audioEncoding: "LINEAR16" },
              });
              if (speechData.audioContent) {
                new Promise((res) =>
                  voice
                    .play(bufferToStream(speechData.audioContent as Uint8Array))
                    .on("finish", res)
                );
              }
              res();
            })
          );
        }
      }
      continue;
    } catch (err) {
      console.error(err);
    }
  } while (true);
}

/**
 * @param binary Buffer
 * returns readableInstanceStream Readable
 */
function bufferToStream(binary: Uint8Array) {
  const readableInstanceStream = new Readable({
    read() {
      this.push(binary);
      this.push(null);
    },
  });

  return readableInstanceStream;
}
