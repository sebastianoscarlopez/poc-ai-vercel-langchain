import { NextRequest } from 'next/server';
import { Message as VercelChatMessage, StreamingTextResponse } from 'ai';
 
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { BytesOutputParser } from '@langchain/core/output_parsers';

export const runtime = 'edge';
 
/**
 * Basic memory formatter that stringifies and passes
 * message history directly into the model.
 */
const formatMessage = (message: VercelChatMessage) => {
  return `${message.role}: ${message.content}`;
};
 
const TEMPLATE = `Tengo estas diez categorias de gastos.
export const CATEGORIES: {{ [key: string]: string }} = {{
  SAVE: 'Save',
  RENT: 'Rent',
  FOOD: 'Food',
  SUBSCRIPTIONS: 'Subscriptions',
  TRANSPORT: 'Transport',
  CLOTHES: 'Clothes',
  HEALTH: 'Health',
  TRAVEL: 'Travel',
  CAR: 'Car',
  DINNING_OUT: 'Dinning out',
  GIFTS: 'Gifts',
  OTHER: 'Other',
  INVEST: 'Invest',
  DONATE: 'Donate',
  PAY_DEBTS: 'Pay Debts',
  PAY_BILLS: 'Pay Bills',
  PERSONAL_DEVELOPMENT: 'Personal Development',
  ENTERTAINMENT: 'Entertainment'
}}

Te paso un mensaje sobre el gasto y deber responder en formato json.
ej: 
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
   * See a full list of supported models at:
   * https://js.langchain.com/docs/modules/model_io/models/
   */
  const model = new ChatOpenAI({
    temperature: 0.2,
  });
 
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