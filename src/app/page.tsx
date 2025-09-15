import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowRight, BookOpen } from 'lucide-react';
import { lessons, news } from '@/lib/data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Chatbot } from '@/components/chatbot';

export default function Home() {
  const heroImage = PlaceHolderImages.find(p => p.id === 'hero');

  return (
    <>
      <div className="container">
        {/* Hero Section */}
        <section className="relative w-full h-[60vh] md:h-[70vh] rounded-lg overflow-hidden my-8">
          {heroImage && (
            <Image
              src={heroImage.imageUrl}
              alt={heroImage.description}
              fill
              className="object-cover"
              data-ai-hint={heroImage.imageHint}
              priority
            />
          )}
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-center p-4">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
              Welcome to PoliSor Lite
            </h1>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl mb-8 drop-shadow-md">
              Your streamlined portal for academic life at Politecnico di Torino.
            </p>
            <Link href="/lessons">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                Explore Lessons <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Featured Lessons Section */}
        <section className="py-12">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold tracking-tight">Featured Lessons</h2>
            <p className="text-muted-foreground mt-2">Get started with our most popular courses.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {lessons.slice(0, 3).map((lesson) => {
              const lessonImage = PlaceHolderImages.find(p => p.id === lesson.imageId);
              return (
                <Card key={lesson.id} className="overflow-hidden transition-transform hover:scale-105 hover:shadow-lg">
                  {lessonImage && (
                    <div className="relative h-48 w-full">
                       <Image
                          src={lessonImage.imageUrl}
                          alt={lesson.title}
                          fill
                          className="object-cover"
                          data-ai-hint={lessonImage.imageHint}
                       />
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><BookOpen className="text-primary"/> {lesson.title}</CardTitle>
                    <CardDescription>{lesson.teacher}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4 h-12">{lesson.description}</p>
                    <Link href={`/lessons/${lesson.id}`}>
                      <Button variant="outline" className="w-full text-primary border-primary hover:bg-primary/10">View Details</Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Latest News Section */}
        <section className="py-12">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold tracking-tight">Latest News</h2>
            <p className="text-muted-foreground mt-2">Stay updated with the latest from campus.</p>
          </div>
          <div className="space-y-6 max-w-3xl mx-auto">
            {news.slice(0, 2).map((article) => (
              <Card key={article.id} className="p-4">
                 <div>
                  <Link href={`/news`}>
                    <h3 className="text-lg font-semibold hover:text-primary transition-colors">{article.title}</h3>
                  </Link>
                  <p className="text-muted-foreground text-sm mt-1">{article.summary}</p>
                </div>
              </Card>
            ))}
            <div className="text-center pt-4">
                <Link href="/news">
                    <Button variant="link" className="text-primary">
                        View all news <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </Link>
            </div>
          </div>
        </section>
      </div>
      <Chatbot />
    </>
  );
}
