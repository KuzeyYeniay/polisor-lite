'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getQuizQuestions, checkQuizAnswers, type QuizQuestion } from '@/lib/quiz-flow';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, CheckCircle, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

type UserAnswer = {
  questionId: string;
  answer: string;
};

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const { id: quizId } = params;
  const { toast } = useToast();

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
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
        const fetchedQuestions = await getQuizQuestions({ quizId, count: 15 });
        if (fetchedQuestions.length === 0) {
           toast({
            title: 'No Questions Found',
            description: 'Could not find any questions for this quiz.',
            variant: 'destructive',
          });
          router.back();
          return;
        }
        setQuestions(fetchedQuestions);
      } catch (error) {
        console.error('Failed to fetch quiz questions:', error);
        toast({
          title: 'Error',
          description: 'Failed to load the quiz. Please try again.',
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

    setUserAnswers(prev => {
        const otherAnswers = prev.filter(a => a.questionId !== newAnswer.questionId);
        return [...otherAnswers, newAnswer];
    });

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(userAnswers.find(a => a.questionId === questions[currentQuestionIndex + 1].id)?.answer ?? null);
    } else {
      // At the last question, prepare for submission
      handleSubmit([...userAnswers, newAnswer]);
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
       setSelectedOption(userAnswers.find(a => a.questionId === questions[currentQuestionIndex - 1].id)?.answer ?? null);
    }
  };
  
  const handleSubmit = async (finalAnswers: UserAnswer[]) => {
      setIsSubmitting(true);
      try {
        if(typeof quizId !== 'string') return;
        const result = await checkQuizAnswers({ quizId, answers: finalAnswers });
        setScore(result);
        setQuizFinished(true);
      } catch (error) {
         console.error('Failed to submit quiz:', error);
        toast({
          title: 'Submission Failed',
          description: 'Could not submit your answers. Please try again.',
          variant: 'destructive',
        });
      } finally {
          setIsSubmitting(false);
      }
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

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  if (!currentQuestion) {
    // This can happen briefly if questions are empty before loading is completely done with all side-effects.
    return (
       <div className="container flex items-center justify-center min-h-[calc(100vh-10rem)]">
         <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
                <Label key={index} className="flex items-center space-x-3 p-4 border rounded-md has-[:checked]:bg-muted has-[:checked]:border-primary transition-all">
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
