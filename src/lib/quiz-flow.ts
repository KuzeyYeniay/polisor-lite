'use server';

/**
 * @fileOverview A server-side flow to fetch random quiz questions from Firestore and check answers.
 *
 * - getQuizQuestions - Fetches a specified number of random questions for a given quiz.
 * - QuizQuestion - The type for a single quiz question returned to the client (without the correct answer).
 * - checkQuizAnswers - Checks the user's answers and returns the score.
 * - CheckQuizAnswersInput - The input type for the checkQuizAnswers function.
 * - CheckQuizAnswersOutput - The return type for the checkQuizAnswers function.
 */

import {z} from 'zod';
import {ai} from '@/ai/genkit';
import { getFirestore, collection, getDocs, doc } from 'firebase/firestore';
import { app } from '@/lib/firebase';

// This is the full question format as stored in Firestore.
const FirestoreQuizQuestionSchema = z.object({
  id: z.string(),
  questionText: z.string(),
  options: z.array(z.string()),
  correctAnswer: z.string(),
});
type FirestoreQuizQuestion = z.infer<typeof FirestoreQuizQuestionSchema>;


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

const GetQuizQuestionsInputSchema = z.object({
  quizId: z.string().describe('The ID of the quiz (e.g., "circuit-design").'),
  count: z.number().int().positive().describe('The number of random questions to fetch.'),
});

const CheckQuizAnswersInputSchema = z.object({
    quizId: z.string(),
    answers: z.array(UserAnswerSchema),
});

const CheckQuizAnswersOutputSchema = z.object({
    score: z.number(),
    total: z.number(),
});

export type GetQuizQuestionsInput = z.infer<typeof GetQuizQuestionsInputSchema>;
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;
export type CheckQuizAnswersInput = z.infer<typeof CheckQuizAnswersInputSchema>;
export type CheckQuizAnswersOutput = z.infer<typeof CheckQuizAnswersOutputSchema>;


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
    const db = getFirestore(app);
    const questionsRef = collection(db, 'quizzes', quizId, 'questions');
    const snapshot = await getDocs(questionsRef);
    
    if (snapshot.empty) {
      console.log('No questions found for this quiz.');
      return [];
    }

    const allQuestions: FirestoreQuizQuestion[] = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        questionText: data.questionText,
        options: data.options,
        correctAnswer: data.correctAnswer,
      };
    });

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
        inputSchema: CheckQuizAnswersInputSchema,
        outputSchema: CheckQuizAnswersOutputSchema,
    },
    async ({quizId, answers}) => {
        const db = getFirestore(app);
        const questionsRef = collection(db, 'quizzes', quizId, 'questions');
        const snapshot = await getDocs(questionsRef);

        const allQuestions: FirestoreQuizQuestion[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            questionText: data.questionText,
            options: data.options,
            correctAnswer: data.correctAnswer,
          };
        });

        const questionMap = new Map(allQuestions.map(q => [q.id, q]));

        let correctAnswersCount = 0;

        for (const userAnswer of answers) {
            const question = questionMap.get(userAnswer.questionId);
            if (question && question.correctAnswer === userAnswer.answer) {
                correctAnswersCount++;
            }
        }

        return {
            score: correctAnswersCount,
            total: answers.length,
        };
    }
);
