'use server';

/**
 * @fileOverview A server-side flow to fetch random quiz questions from Firestore.
 *
 * - getQuizQuestions - A function that fetches a specified number of random questions for a given quiz.
 * - GetQuizQuestionsInput - The input type for the getQuizQuestions function.
 * - QuizQuestion - The type for a single quiz question returned to the client (without the correct answer).
 * - checkQuizAnswers - A function that checks the user's answers and returns the score.
 * - CheckQuizAnswersInput - The input type for the checkQuizAnswers function.
 * - CheckQuizAnswersOutput - The return type for the checkQuizAnswers function.
 */

import {z} from 'zod';
import {ai} from '@/ai/genkit';
import * as admin from 'firebase-admin';

// Helper function to initialize Firebase Admin and get Firestore instance
// This ensures initialization only happens once.
function getFirestoreInstance() {
  if (!admin.apps.length) {
    try {
      // Explicitly providing the project ID helps in environments where ADC
      // might not be automatically configured.
      admin.initializeApp({
        projectId: process.env.GCLOUD_PROJECT || 'studio-5751693164-b0fd0'
      });
    } catch (e) {
      console.error('Firebase admin initialization error', e);
      throw new Error("Failed to initialize Firebase Admin SDK.");
    }
  }
  return admin.firestore();
}


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

const UserAnswerSchema = z.object({
    questionId: z.string(),
    answer: z.string(),
});

export type GetQuizQuestionsInput = z.infer<typeof GetQuizQuestionsInputSchema>;
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;
export type CheckQuizAnswersInput = z.infer<z.ZodObject<{ quizId: z.ZodString; answers: z.ZodArray<typeof UserAnswerSchema, "many">; }, "strip", z.ZodTypeAny, { quizId: string; answers: { questionId: string; answer: string; }[]; }, { quizId: string; answers: { questionId: string; answer: string; }[]; }>>;
export type CheckQuizAnswersOutput = z.infer<z.ZodObject<{ score: z.ZodNumber; total: z.ZodNumber; }, "strip", z.ZodTypeAny, { score: number; total: number; }, { score: number; total: number; }>>;


export async function getQuizQuestions(input: GetQuizQuestionsInput): Promise<QuizQuestion[]> {
  return getQuizQuestionsFlow(input);
}

export async function checkQuizAnswers(input: CheckQuizAnswersInput): Promise<CheckQuizAnswersOutput> {
    return checkQuizAnswersFlow(input);
}

const getQuizQuestionsFlow = ai.defineFlow(
  {
    name: 'getQuizQuestionsFlow',
    inputSchema: GetQuizQuestionsInputSchema,
    outputSchema: z.array(QuizQuestionSchema),
  },
  async ({quizId, count}) => {
    const db = getFirestoreInstance();
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

const checkQuizAnswersFlow = ai.defineFlow(
    {
        name: 'checkQuizAnswersFlow',
        inputSchema: z.object({
            quizId: z.string(),
            answers: z.array(UserAnswerSchema),
        }),
        outputSchema: z.object({
            score: z.number(),
            total: z.number(),
        }),
    },
    async ({quizId, answers}) => {
        const db = getFirestoreInstance();
        const questionsRef = db.collection('quizzes').doc(quizId).collection('questions');
        let correctAnswersCount = 0;

        // This is not the most efficient way for a very large number of answers,
        // but for a 15-question quiz, it's perfectly fine.
        // We fetch each question document individually to check the correct answer.
        for (const userAnswer of answers) {
            const questionDoc = await questionsRef.doc(userAnswer.questionId).get();
            if (questionDoc.exists) {
                const questionData = questionDoc.data();
                if (questionData?.correctAnswer === userAnswer.answer) {
                    correctAnswersCount++;
                }
            }
        }

        return {
            score: correctAnswersCount,
            total: answers.length,
        };
    }
);
