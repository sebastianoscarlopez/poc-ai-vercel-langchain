import { NextRequest } from 'next/server';
import { Message as VercelChatMessage, StreamingTextResponse } from 'ai';
 
import { PromptTemplate } from "@langchain/core/prompts";
import { BytesOutputParser } from '@langchain/core/output_parsers';

import { ChatOpenAI } from "@langchain/openai";
import { Ollama } from "@langchain/community/llms/ollama";

const llmOllama = new Ollama({
  baseUrl: "http://localhost:11434", // Default value
  model: "stablelm-zephyr",
  temperature: 0.01,
});


const llmOpenAI = new ChatOpenAI({
  temperature: 0.2,
});

const model = llmOllama;

export const runtime = 'edge';
 
/**
 * Basic memory formatter that stringifies and passes
 * message history directly into the model.
 */
const formatMessage = (message: VercelChatMessage) => {
  return `${message.role}: ${message.content}`;
};
// ayer lave el auto costo $ 1234 y tardaron 2 horas
// ayer compre un pancho por $ 1234, lo espere 15' y lo comí en la plaza
const TEMPLATE = `
Eres un clasificador de gastos recibes un input sobre el gasto y solo debes responder en formato json, si la fecha no esta deja en blanco el valor y nunca debes dar información adicional.

CATEGORIES: SAVE | RENT | FOOD | SUBSCRIPTIONS | TRANSPORT | CLOTHES | HEALTH | TRAVEL | CAR | DINNING_OUT | GIFTS | OTHER | INVEST | DONATE | PAY_DEBTS | PAY_BILLS | PERSONAL_DEVELOPMENT | ENTERTAINMENT

ejemplo de input y output: 
input: "18/11/2023: Comida $3000"
output: {{
    date: '18/11/2023',
    message: 'Comida $3000',
    categories: 'FOOD',
    amount: 3000
  }}

Current conversation:
{chat_history}
 
User: {input}
AI:`;
 
/*
 * This handler initializes and calls a simple chain with a prompt,
 * chat model, and output parser. See the docs for more information:
 *
 * https://js.langchain.com/docs/guides/expression_language/cookbook#prompttemplate--llm--outputparser
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const messages = body.messages ?? [];
  const formattedPreviousMessages = messages.slice(0, -1).map(formatMessage);
  const currentMessageContent = messages[messages.length - 1].content;
 
  const prompt = PromptTemplate.fromTemplate(TEMPLATE);

  /**
   * Chat models stream message chunks rather than bytes, so this
   * output parser handles serialization and encoding.
   */
  const outputParser = new BytesOutputParser();
 
  /*
   * Can also initialize as:
   *
   * import { RunnableSequence } from "langchain/schema/runnable";
   * const chain = RunnableSequence.from([prompt, model, outputParser]);
   */
  const chain = prompt.pipe(model).pipe(outputParser);
 
  const stream = await chain.stream({
    chat_history: formattedPreviousMessages.join('\n'),
    input: currentMessageContent,
  });
 
  return new StreamingTextResponse(stream);
}