const { OpenAI } =  require("@hellobardo/open-ai-sdk") as typeof import("@hellobardo/open-ai-sdk/src");

const ai = new OpenAI(process.env.GPT_TOKEN || "");

export interface Question {
  question: string;
  author: string;
  answer: string;
}

export async function getResponse(
  questions: Question[],
  author: string,
  ask: string
) {
  const last6 =
    questions.length > 6
      ? questions.slice(questions.length - 6, questions.length)
      : questions;
  const promptSoFar = [
    {
      author: "anonymous",
      question: "Hello bot, who are you?",
      answer:
        "hey anonymous, I am an discord bot AI created by shmuel hizmi. How can I help you today?",
    } as Question,
    {
      author: "shmuel",
      question: "Hey, I'm shumuel",
      answer: "Halan shmuel, whats going on? do you like to talk about computer science?",
    } as Question,
    ...last6,
  ].reduce(
    (soFar, current) =>
      `${soFar}\n${current.author}: ${current.question}.\nbot: ${current.answer}\n`,
    ""
  );
  const response = await ai.completion("davinci", {
    prompt: `The following is a conversation with an AI assistant. The assistant is helpful, creative, clever, and very friendly. in addition the bot always give long and precise answers\n${promptSoFar}${author}:${ask}\nbot:`,
    stop: ["\n"],
    temperature: 0.7,
    max_tokens: 150,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0.6,
  });
  return response.data.choices[0].text;
}
