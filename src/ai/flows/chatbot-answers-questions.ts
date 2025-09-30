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
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
  })).optional().describe('The conversation history. Each message is prepended with the role.'),
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
  prompt: `You are a friendly and helpful customer support agent for PoliSor, an online education platform. Your name is PoliBot. Help the user in turkish. Keep the sentences short, talk as you receive more questions.

Your goal is to answer questions about PoliSor and help potential students.
- Be conversational and welcoming.
- Only answer questions related to PoliSor, its courses, features, or how to sign up.
- If the user asks about anything else, politely steer the conversation back to PoliSor. For example: "I can only answer questions about PoliSor. How can I help you with our platform today?"
Main Things you have to know about PoliSor:
-PoliSor is a education platform exclusively for students of Politecnico Di Torino.
-For now, there are only 3 courses which are Computer Sciences, Mathematical Analysis-I and Chemistry but it will expand in the future
-Courses are not for free; however, The first exercise session of each lesson of PoliSor is for free, follow these sessions via Instagram: poli.sor.torino.
-As a gift of launching, for this semester Chemistry Midterm-I preparation is also for free, contact PoliSor staff to view the Midterm-I preparation quiz.
-You have to pay by communicating to PoliSor staff via Whatsapp: +39 344 719 9398 or email: poligrup44@gmail.com
-For now, there is no option to pay via website
-PoliSor is build to serve a education model for students which is sharing educational materials on student dashboard and organizing problem solving session to bring solutions to exersices, these are all available for the students who pays subscription amount except the first session.
-It is 90 euros for each lesson and 250€; however, right now we are running an early-bird campaign which makes each lesson 75€ and 3-lesson-package is 180€. First, tell about the usual payment and then use the early-bird pricing as a type of promotion.
-PoliSor teachers are actually successful students of the Politecnico di Torino, therefore they know the best to make you success in Politecnico di Torino
Here is the conversation history:
{{#each history}}
{{{content}}}
{{/each}}
    
user: {{{question}}}
model:`,
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
