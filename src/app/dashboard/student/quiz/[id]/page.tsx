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
import { collection, getDocs, where, query } from 'firebase/firestore';

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
  const { id: quizId } = params as { id: string };
  const { toast } = useToast();

  const [questions, setQuestions] = useState<FirestoreQuizQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [quizFinished, setQuizFinished] = useState(false);
  const [score, setScore] = useState<{ score: number; total: number } | null>(null);
  const [fetchInfo, setFetchInfo] = useState<{ raw: number; normalized: number; source: 'subcollection' | 'top-level' | null }>({ raw: 0, normalized: 0, source: null });

  useEffect(() => {
    async function fetchQuestions() {
      if (typeof quizId !== 'string') return;
      setIsLoading(true);

      try {
        // 1) quizzes/{quizId}/questions
        let src: 'subcollection' | 'top-level' | null = null;

        const subRef = collection(db, 'quizzes', quizId, 'questions');
        let snap = await getDocs(subRef);

        // 2) fallback: top-level questions (where quizId == quizId)
        if (snap.empty) {
          const topRef = collection(db, 'questions');
          const q = query(topRef, where('quizId', '==', quizId));
          const topSnap = await getDocs(q);
          if (!topSnap.empty) {
            snap = topSnap;
            src = 'top-level';
          } else {
            src = null;
          }
        } else {
          src = 'subcollection';
        }

        if (snap.empty) {
          setFetchInfo({ raw: 0, normalized: 0, source: src });
          setQuestions([]);
          return;
        }

        const rawCount = snap.size;

        // --- NORMALIZE (soru metni doc.id'den de alınır) ---
        const normalized: FirestoreQuizQuestion[] = snap.docs
          .map((doc) => {
            const data: any = doc.data();

            // Soru metni: öncelik data.* ama yoksa DOC ID
            const questionText: string =
              data?.questionText ??
              data?.question ??
              data?.text ??
              data?.prompt ??
              doc.id ?? // <- senin şema
              '';

            // seçenekler
            let options: string[] = [];
            if (Array.isArray(data?.options)) {
              options = data.options.filter((s: any) => typeof s === 'string');
            } else if (Array.isArray(data?.choices)) {
              options = data.choices.filter((s: any) => typeof s === 'string');
            } else {
              // optionA..D fallback'i istersen açabilirsin
              const cand = [data?.optionA, data?.optionB, data?.optionC, data?.optionD].filter(
                (s: any) => typeof s === 'string' && s.length > 0
              );
              if (cand.length) options = cand;
            }

            // doğru cevap
            let correctAnswer: string =
              data?.correctAnswer ??
              data?.answer ??
              data?.correct ??
              '';

            // index verildiyse
            if (!correctAnswer && (data?.correctIndex ?? data?.correct_choice_index ?? data?.answerIndex) != null) {
              const idx = Number(data?.correctIndex ?? data?.correct_choice_index ?? data?.answerIndex);
              if (!Number.isNaN(idx) && options[idx] != null) {
                correctAnswer = options[idx];
              }
            }

            return {
              id: doc.id,
              questionText,
              options,
              correctAnswer,
            };
          })
          .filter((q) => q.questionText && q.options?.length > 0);

        const selected = normalized.sort(() => 0.5 - Math.random()).slice(0, 15);

        setFetchInfo({ raw: rawCount, normalized: normalized.length, source: src });
        setQuestions(selected);

        // ilk sorunun seçimini yükle
        if (selected.length > 0) {
          const firstSelected = userAnswers.find((a) => a.questionId === selected[0].id)?.answer ?? null;
          setSelectedOption(firstSelected);
        }
      } catch (error) {
        console.error('Failed to fetch quiz questions:', error);
        toast({
          title: 'Quiz Yüklenemedi',
          description: 'Sorular yüklenirken bir hata oluştu. Lütfen yeniden dene.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId]);

  const handleNext = () => {
    if (selectedOption === null) {
      toast({ title: 'Lütfen bir şık işaretle.', variant: 'destructive' });
      return;
    }

    const newAnswer: UserAnswer = {
      questionId: questions[currentQuestionIndex].id,
      answer: selectedOption,
    };

    const updatedAnswers = userAnswers.filter((a) => a.questionId !== newAnswer.questionId);
    updatedAnswers.push(newAnswer);
    setUserAnswers(updatedAnswers);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      const nextQuestionId = questions[currentQuestionIndex + 1].id;
      const previouslySelected = updatedAnswers.find((a) => a.questionId === nextQuestionId)?.answer ?? null;
      setSelectedOption(previouslySelected);
    } else {
      handleSubmit(updatedAnswers);
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
      const prevQuestionId = questions[currentQuestionIndex - 1].id;
      const previouslySelected = userAnswers.find((a) => a.questionId === prevQuestionId)?.answer ?? null;
      setSelectedOption(previouslySelected);
    }
  };

  const handleSubmit = (finalAnswers: UserAnswer[]) => {
    setIsSubmitting(true);

    let correctAnswersCount = 0;
    for (const userAnswer of finalAnswers) {
      const question = questions.find((q) => q.id === userAnswer.questionId);
      if (question && question.correctAnswer === userAnswer.answer) {
        correctAnswersCount++;
      }
    }

    setScore({ score: correctAnswersCount, total: finalAnswers.length });
    setQuizFinished(true);
    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="container flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-6 w-full" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-1/3 ml-auto" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // boş durum: anlaşılır teşhis
  if (questions.length === 0 && !isLoading) {
    return (
      <div className="container flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Card className="w-full max-w-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="text-destructive h-6 w-6" />
              Quiz soruları yüklenemedi
            </CardTitle>
            <CardDescription>
              {fetchInfo.source === null
                ? 'Bu quiz için Firestore’da soru bulunamadı.'
                : 'Soru dokümanları bulundu fakat beklenen alanlar olmadığı için görüntülenemedi.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p><strong>Detay:</strong> Ham: {fetchInfo.raw}, normalize: {fetchInfo.normalized}.</p>
            <p>
              <strong>Aranan yollar:</strong> <code>quizzes/{String(quizId)}/questions</code>{' '}
              {fetchInfo.source === 'subcollection' ? '(bulundu)' : ''} ve{' '}
              <code>questions where quizId == "{String(quizId)}"</code>{' '}
              {fetchInfo.source === 'top-level' ? '(bulundu)' : ''}.
            </p>
            <div className="text-xs">
              Beklenen örnek şema:
              <pre className="p-2 rounded border bg-muted/50 overflow-auto mt-1">
{`{
  // Soru metni yoksa doküman ID'si kullanılır
  questionText?: string,
  options: string[],           // veya choices / optionA..D
  correctAnswer: string,       // veya correct/answer ya da correctIndex (0 tabanlı)
}`}
              </pre>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => router.back()}>Geri Dön</Button>
              <Button onClick={() => router.refresh()}>Tekrar Dene</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // skor ekranı
  if (quizFinished && score !== null) {
    const percentage = Math.round((score.score / score.total) * 100);
    const isPass = percentage >= 60;
    return (
      <div className="container flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-full mb-4"
              style={{ backgroundColor: isPass ? 'var(--primary)' : 'var(--destructive)' }}
            >
              {isPass ? (
                <CheckCircle className="h-10 w-10 text-primary-foreground" />
              ) : (
                <AlertTriangle className="h-10 w-10 text-destructive-foreground" />
              )}
            </div>
            <CardTitle>Quiz Tamamlandı!</CardTitle>
            <CardDescription>
              Skorun: {score.score} Üzerinden: {score.total}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold mb-4">{percentage}%</p>
            <Progress value={percentage} className="h-4 mb-6" />
            <p className="text-muted-foreground mb-6">
              {isPass ? 'Great job! You passed the quiz.' : 'You did not pass. Better luck next time!'}
            </p>
            <Button onClick={() => router.push(`/dashboard/student/lessons/${quizId}`)}>
              Ders Paneline Dön
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  if (!currentQuestion) {
    return (
      <div className="container flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const qText = currentQuestion.questionText ?? '';

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-10rem)]">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <Progress value={progress} className="mb-2 h-2" />
          <CardTitle>Soru {currentQuestionIndex + 1} of {questions.length}</CardTitle>
          <CardDescription className="text-lg pt-4 whitespace-pre-wrap">
            {qText}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={selectedOption ?? undefined}
            onValueChange={setSelectedOption}
            className="space-y-4"
          >
            {currentQuestion.options.map((option, index) => {
              const id = `option-${currentQuestion.id}-${index}`;
              return (
                <Label
                  key={id}
                  htmlFor={id}
                  className="flex items-center space-x-3 p-4 border rounded-md has-[:checked]:bg-muted has-[:checked]:border-primary transition-all cursor-pointer"
                >
                  <RadioGroupItem value={option} id={id} />
                  <span>{option}</span>
                </Label>
              );
            })}
          </RadioGroup>
        </CardContent>
        <div className="flex justify-between p-6 pt-0">
          <Button variant="outline" onClick={handleBack} disabled={currentQuestionIndex === 0}>
            <ChevronLeft className="mr-2" />
            Geri
          </Button>
          <Button onClick={handleNext} disabled={isSubmitting}>
            {isSubmitting && currentQuestionIndex === questions.length - 1 ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Teslim ediliyor...
              </>
            ) : (
              currentQuestionIndex === questions.length - 1 ? 'Submit Quiz' : 'Next'
            )}
            {currentQuestionIndex < questions.length - 1 && <ChevronRight className="ml-2" />}
          </Button>
        </div>
      </Card>
    </div>
  );
}
