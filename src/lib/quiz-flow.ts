'use server';

/**
 * @fileOverview A server-side flow to fetch random quiz questions from Firestore.
 *
 * - getQuizQuestions - A function that fetches a specified number of random questions for a given quiz.
 * - GetQuizQuestionsInput - The input type for the getQuizQuestions function.
 * - QuizQuestion - The type for a single quiz question returned to the client (without the correct answer).
 */

import {z} from 'zod';
import {ai} from '@/ai/genkit';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: `https://${process.env.GCLOUD_PROJECT}.firebaseio.com`,
  });
}

const db = admin.firestore();

const GetQuizQuestionsInputSchema = z.object({
  quizId: z.string().describe('The ID of the quiz (e.g., "circuit-design").'),
  count: z.number().int().positive().describe('The number of random questions to fetch.'),
});

// This is the question format that will be sent to the client.
// Notice that `correctAnswer` is not included.
const QuizQuestionSchema = z.object({
  id: z.string(),
  questionText: z.string(),
  options: z.array(z.string()),
});

export type GetQuizQuestionsInput = z.infer<typeof GetQuizQuestionsInputSchema>;
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;

export async function getQuizQuestions(input: GetQuizQuestionsInput): Promise<QuizQuestion[]> {
  return getQuizQuestionsFlow(input);
}

const getQuizQuestionsFlow = ai.defineFlow(
  {
    name: 'getQuizQuestionsFlow',
    inputSchema: GetQuizQuestionsInputSchema,
    outputSchema: z.array(QuizQuestionSchema),
  },
  async ({quizId, count}) => {
    const questionsRef = db.collection('quizzes').doc(quizId).collection('questions');
    const snapshot = await questionsRef.get();

    if (snapshot.empty) {
      console.log('No questions found for this quiz.');
      return [];
    }

    const allQuestions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Simple random shuffle and slice
    const shuffled = allQuestions.sort(() => 0.5 - Math.random());
    const selectedQuestions = shuffled.slice(0, count);

    // Map to the client-safe format (without correct answer)
    return selectedQuestions.map(q => ({
      id: q.id,
      questionText: q.questionText,
      options: q.options,
    }));
  }
);