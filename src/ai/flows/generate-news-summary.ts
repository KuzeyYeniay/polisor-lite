'use server';

/**
 * @fileOverview An AI agent that generates concise summaries of news articles from Politecnico di Torino RSS feeds.
 *
 * - generateNewsSummary - A function that generates news summaries from Politecnico di Torino RSS feeds.
 * - GenerateNewsSummaryInput - The input type for the generateNewsSummary function.
 * - GenerateNewsSummaryOutput - The return type for the generateNewsSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateNewsSummaryInputSchema = z.object({
  rssFeedUrl: z
    .string()
    .describe('The URL of the Politecnico di Torino RSS feed.'),
});
export type GenerateNewsSummaryInput = z.infer<typeof GenerateNewsSummaryInputSchema>;

const GenerateNewsSummaryOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the news articles.'),
  progress: z.string().describe('Progress message about the flow execution')
});
export type GenerateNewsSummaryOutput = z.infer<typeof GenerateNewsSummaryOutputSchema>;

export async function generateNewsSummary(input: GenerateNewsSummaryInput): Promise<GenerateNewsSummaryOutput> {
  return generateNewsSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateNewsSummaryPrompt',
  input: {schema: GenerateNewsSummaryInputSchema},
  output: {schema: GenerateNewsSummaryOutputSchema},
  prompt: `You are an AI assistant tasked with summarizing news articles from Politecnico di Torino RSS feeds.

  Please generate a concise summary of the news articles from the following RSS feed URL:
  {{{rssFeedUrl}}}
  `,
});

const generateNewsSummaryFlow = ai.defineFlow(
  {
    name: 'generateNewsSummaryFlow',
    inputSchema: GenerateNewsSummaryInputSchema,
    outputSchema: GenerateNewsSummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    output!.progress = 'Generated a short summary of the news articles from the RSS feed.';
    return output!;
  }
);
