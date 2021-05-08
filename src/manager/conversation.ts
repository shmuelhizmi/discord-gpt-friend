import { getResponse, Question } from "../api/gpt";
import { lastTaskQueuer } from "../utils/tasks";

export function createConversation() {
  const queue = lastTaskQueuer();
  const questions: Question[] = [];
  queue.start();
  return {
    ask(question: string, author: string) {
      return new Promise<string>((res) => {
        queue.queueTask(async () => {
          const answer = await getResponse(questions, author, question);
          questions.push({ author, question, answer });
          res(answer);
        });
      });
    },
  };
}
