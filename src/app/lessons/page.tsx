import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { lessons } from '@/lib/data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { BookOpen } from 'lucide-react';

export default function LessonsPage() {
  return (
    <div className="container py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold tracking-tight">Derslerimiz</h1>
        <p className="text-muted-foreground mt-2">Sizi sınavlara eksiksiz hazırlayan kurslarımızı keşfedin.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {lessons.map((lesson) => {
          const lessonImage = PlaceHolderImages.find((p) => p.id === lesson.imageId);
          return (
            <Card key={lesson.id} className="flex flex-col transition-transform hover:scale-105 hover:shadow-lg">
              {lessonImage && (
                <div className="relative h-48 w-full">
                  <Image
                    src={lessonImage.imageUrl}
                    alt={lesson.title}
                    fill
                    className="object-cover rounded-t-lg"
                    data-ai-hint={lessonImage.imageHint}
                  />
                </div>
              )}
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><BookOpen className="text-primary"/> {lesson.title}</CardTitle>
                <CardDescription>{lesson.teacher}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-muted-foreground">{lesson.description}</p>
              </CardContent>
              <CardFooter>
                <Link href={`/lessons/${lesson.id}`} className="w-full">
                  <Button variant="outline" className="w-full text-primary border-primary hover:bg-primary/10">View Calendar & Details</Button>
                </Link>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
