'use server';

/**
 * @fileOverview This file defines a Genkit flow for a chatbot that answers user questions related to Politecnico di Torino.
 *
 * - chatbotAnswersQuestions - A function that accepts a question and returns an answer from the chatbot.
 * - ChatbotAnswersQuestionsInput - The input type for the chatbotAnswersQuestions function.
 * - ChatbotAnswersQuestionsOutput - The return type for the chatbotAnswersQuestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChatbotAnswersQuestionsInputSchema = z.object({
  question: z.string().describe('The user question to be answered by the chatbot.'),
});
export type ChatbotAnswersQuestionsInput = z.infer<typeof ChatbotAnswersQuestionsInputSchema>;

const ChatbotAnswersQuestionsOutputSchema = z.object({
  answer: z.string().describe('The answer to the user question from the chatbot.'),
});
export type ChatbotAnswersQuestionsOutput = z.infer<typeof ChatbotAnswersQuestionsOutputSchema>;

export async function chatbotAnswersQuestions(input: ChatbotAnswersQuestionsInput): Promise<ChatbotAnswersQuestionsOutput> {
  return chatbotAnswersQuestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'chatbotAnswersQuestionsPrompt',
  input: {schema: ChatbotAnswersQuestionsInputSchema},
  output: {schema: ChatbotAnswersQuestionsOutputSchema},
  prompt: `You are a chatbot that answers questions about Politecnico di Torino.

  User Question: {{{question}}}

  Answer: `,
});

const chatbotAnswersQuestionsFlow = ai.defineFlow(
  {
    name: 'chatbotAnswersQuestionsFlow',
    inputSchema: ChatbotAnswersQuestionsInputSchema,
    outputSchema: ChatbotAnswersQuestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
