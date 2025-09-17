'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, CheckCircle, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

// This is the full question format as stored in Firestore.
type FirestoreQuizQuestion = {
  id: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
};

type UserAnswer = {
  questionId: string;
  answer: string;
};

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const { id: quizId } = params;
  const { toast } = useToast();

  const [questions, setQuestions] = useState<FirestoreQuizQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [quizFinished, setQuizFinished] = useState(false);
  const [score, setScore] = useState<{ score: number; total: number } | null>(null);

  useEffect(() => {
    async function fetchQuestions() {
      if (typeof quizId !== 'string') return;
      try {
        setIsLoading(true);
        const questionsRef = collection(db, 'quizzes', quizId, 'questions');
        const snapshot = await getDocs(questionsRef);

        if (snapshot.empty) {
          toast({
            title: 'No Questions Found',
            description: 'Could not find any questions for this quiz.',
            variant: 'destructive',
          });
          router.back();
          return;
        }

        const fetchedQuestions: FirestoreQuizQuestion[] = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        } as FirestoreQuizQuestion));

        // Simple random shuffle and slice
        const shuffled = fetchedQuestions.sort(() => 0.5 - Math.random());
        const selectedQuestions = shuffled.slice(0, 15);
        
        setQuestions(selectedQuestions);

      } catch (error) {
        console.error('Failed to fetch quiz questions:', error);
        toast({
          title: 'Error Loading Quiz',
          description: 'There was an issue loading the questions. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchQuestions();
  }, [quizId, router, toast]);

  const handleNext = () => {
    if (selectedOption === null) {
        toast({ title: 'Please select an answer.', variant: 'destructive' });
        return;
    }
    
    const newAnswer: UserAnswer = {
      questionId: questions[currentQuestionIndex].id,
      answer: selectedOption,
    };

    const updatedAnswers = userAnswers.filter(a => a.questionId !== newAnswer.questionId);
    updatedAnswers.push(newAnswer);
    setUserAnswers(updatedAnswers);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      const nextQuestionId = questions[currentQuestionIndex + 1].id;
      const previouslySelected = updatedAnswers.find(a => a.questionId === nextQuestionId)?.answer ?? null;
      setSelectedOption(previouslySelected);
    } else {
      // At the last question, submit
      handleSubmit(updatedAnswers);
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
       const prevQuestionId = questions[currentQuestionIndex - 1].id;
       const previouslySelected = userAnswers.find(a => a.questionId === prevQuestionId)?.answer ?? null;
       setSelectedOption(previouslySelected);
    }
  };
  
  const handleSubmit = (finalAnswers: UserAnswer[]) => {
      setIsSubmitting(true);
      
      let correctAnswersCount = 0;

      for (const userAnswer of finalAnswers) {
          const question = questions.find(q => q.id === userAnswer.questionId);
          if (question && question.correctAnswer === userAnswer.answer) {
              correctAnswersCount++;
          }
      }

      setScore({
          score: correctAnswersCount,
          total: finalAnswers.length,
      });

      setQuizFinished(true);
      setIsSubmitting(false);
  }

  if (isLoading) {
    return (
      <div className="container flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Card className="w-full max-w-2xl">
           <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2"/>
            <Skeleton className="h-4 w-1/2"/>
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-6 w-full"/>
             <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
             <Skeleton className="h-10 w-1/3 ml-auto"/>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (quizFinished && score !== null) {
     const percentage = Math.round((score.score / score.total) * 100);
     const isPass = percentage >= 60;
    return (
         <div className="container flex items-center justify-center min-h-[calc(100vh-10rem)]">
            <Card className="w-full max-w-md text-center">
                 <CardHeader>
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full mb-4" style={{ backgroundColor: isPass ? 'var(--primary)' : 'var(--destructive)' }}>
                        {isPass ? <CheckCircle className="h-10 w-10 text-primary-foreground" /> : <AlertTriangle className="h-10 w-10 text-destructive-foreground" />}
                    </div>
                    <CardTitle>Quiz Complete!</CardTitle>
                    <CardDescription>You scored {score.score} out of {score.total}.</CardDescription>
                </CardHeader>
                <CardContent>
                     <p className="text-4xl font-bold mb-4">{percentage}%</p>
                    <Progress value={percentage} className="h-4 mb-6" />
                    <p className="text-muted-foreground mb-6">{isPass ? "Great job! You passed the quiz." : "You did not pass. Better luck next time!"}</p>
                    <Button onClick={() => router.push(`/dashboard/student/lessons/${quizId}`)}>
                        Back to Lesson Portal
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
  }
  
  if (questions.length === 0 && !isLoading) {
     return (
       <div className="container flex items-center justify-center min-h-[calc(100vh-10rem)]">
         <Card className="w-full max-w-md text-center">
            <CardHeader>
                <CardTitle className="flex items-center justify-center gap-2">
                    <AlertTriangle className="text-destructive h-6 w-6"/> Error
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Could not load quiz questions. Please try again later.</p>
                <Button asChild className="mt-6" variant="outline" onClick={() => router.back()}>
                    <p>Go Back</p>
                </Button>
            </CardContent>
         </Card>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  
  if (!currentQuestion) {
     return (
        <div className="container flex items-center justify-center min-h-[calc(100vh-10rem)]">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
     )
  }

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-10rem)]">
      <Card className="w-full max-w-2xl">
        <CardHeader>
            <Progress value={progress} className="mb-2 h-2" />
            <CardTitle>Question {currentQuestionIndex + 1} of {questions.length}</CardTitle>
            <CardDescription className="text-lg pt-4">{currentQuestion.questionText}</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={selectedOption ?? undefined} onValueChange={setSelectedOption} className="space-y-4">
            {currentQuestion.options.map((option, index) => (
                <Label key={index} className="flex items-center space-x-3 p-4 border rounded-md has-[:checked]:bg-muted has-[:checked]:border-primary transition-all cursor-pointer">
                    <RadioGroupItem value={option} id={`option-${index}`} />
                    <span>{option}</span>
                </Label>
            ))}
          </RadioGroup>
        </CardContent>
        <div className="flex justify-between p-6 pt-0">
             <Button variant="outline" onClick={handleBack} disabled={currentQuestionIndex === 0}>
                <ChevronLeft className="mr-2"/>
                Back
             </Button>
             <Button onClick={handleNext} disabled={isSubmitting}>
                {isSubmitting && currentQuestionIndex === questions.length - 1 ? (
                    <> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting... </>
                ) : (
                    currentQuestionIndex === questions.length - 1 ? 'Submit Quiz' : 'Next'
                )}
                 {currentQuestionIndex < questions.length - 1 && <ChevronRight className="ml-2"/>}
             </Button>
        </div>
      </Card>
    </div>
  );
}
