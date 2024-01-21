import { NextRequest, NextResponse } from 'next/server';
import { Message as VercelChatMessage, StreamingTextResponse } from 'ai';

import { z } from 'zod';

import { PromptTemplate } from '@langchain/core/prompts';
import { StructuredOutputParser } from 'langchain/output_parsers';

import { ChatOpenAI } from '@langchain/openai';
import { Ollama } from '@langchain/community/llms/ollama';

const llmOllama = new Ollama({
  baseUrl: process.env.BASE_URL,
  model: 'stablelm-zephyr',
  temperature: 0.01,
});

const llmOpenAI = new ChatOpenAI({
  azureOpenAIBasePath: process.env.BASE_URL,
  temperature: 0.0,
});

const model = llmOpenAI;

export const runtime = 'edge';

const spent = z.object({
  categories: z.array(
    z.enum([
      'SAVE',
      'RENT',
      'FOOD',
      'SUBSCRIPTIONS',
      'TRANSPORT',
      'CLOTHES',
      'HEALTH',
      'TRAVEL',
      'CAR',
      'DINNING_OUT',
      'GIFTS',
      'OTHER',
      'INVEST',
      'DONATE',
      'PAY_DEBTS',
      'PAY_BILLS',
      'PERSONAL_DEVELOPMENT',
      'ENTERTAINMENT',
    ])
  ).describe('the category of the expense it must be an array of one or more of these'),
  amount: z.number().describe('the amount of money'),
  product: z.string().describe('the product or service you bought'),
  date: z.date().optional().describe('the date of the expense in'),
});

// ayer lave el auto costo $ 1234 y tardaron 2 horas
// ayer compre un pancho por $ 1234, lo espere 15' y lo comí en la plaza

const TEMPLATE = `You are an expense classifier, you receive input about the expense. If the date is not there, leave the value blank.
{format_instructions}

input: {input}

your response must be as short as possible and should never give additional information
some data is optional, if it is not there, leave the value blank
today is ${new Date().toISOString().slice(0, 10)}
`;

/*
 * This handler initializes and calls a simple chain with a prompt,
 * chat model, and output parser. See the docs for more information:
 *
 * https://js.langchain.com/docs/guides/expression_language/cookbook#prompttemplate--llm--outputparser
 */
export async function POST(req: NextRequest, res: NextResponse) {
  const body = await req.json();
  const messages = body.messages ?? [];
  const currentMessageContent = messages[messages.length - 1].content;

  const prompt = PromptTemplate.fromTemplate(TEMPLATE);

  /**
   * Chat models stream message chunks rather than bytes, so this
   * output parser handles serialization and encoding.
   */
  const outputParser = StructuredOutputParser.fromZodSchema(spent);

  /*
   * Can also initialize as:
   *
   * import { RunnableSequence } from "langchain/schema/runnable";
   * const chain = RunnableSequence.from([prompt, model, outputParser]);
   */
  const chain = prompt.pipe(model)//.pipe(outputParser);

  const formatInstructions = outputParser.getFormatInstructions();
  console.log('formatInstructions:', formatInstructions);
  const result = await chain.invoke({
    input: currentMessageContent,
    format_instructions: formatInstructions,
  });
  console.log('result:', result);
  // const stream = await chain.stream({
  //   input: currentMessageContent,
  //   format_instructions: formatInstructions,
  // });

  return new Response(typeof result === 'string' ? result : result?.content?.toString());
}
