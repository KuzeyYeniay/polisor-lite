import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowRight, BookOpen } from 'lucide-react';
import { lessons} from '@/lib/data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Chatbot } from '@/components/chatbot';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function Home() {
  const heroImage = PlaceHolderImages.find(p => p.id === 'hero');

  // Create a unique list of teachers
  const teachers = lessons.reduce((acc, lesson) => {
    if (!acc.some(teacher => teacher.name === lesson.teacher)) {
      acc.push({
        name: lesson.teacher,
        imageId: lesson.teacherImageId,
      });
    }
    return acc;
  }, [] as { name: string; imageId: string }[]);

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
              PoliSor
            </h1>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl mb-8 drop-shadow-md">
            Akademik kariyerindeki verimi arttırman için özenle hazırlanmış ders materyallerin, çözümlü sınavların ve daha fazlası burada.
            </p>
            <Link href="/lessons">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                Derslere Göz at <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Featured Lessons Section */}
        <section className="py-12">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold tracking-tight">Derslerimiz</h2>
            <p className="text-muted-foreground mt-2">Her biri alanında başarılı öğrenciler tarafından yönetilen çeşitli kurslarımızı keşfedin.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mx-5">
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

        {/* Instructors Section */}
        <section className="py-12">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold tracking-tight">Eğitmenlerimiz</h2>
            <p className="text-muted-foreground mt-2">Sizi başarıya ulaştıracak eğitmenlerimizle tanışın.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {teachers.map((teacher) => {
                const teacherImage = PlaceHolderImages.find(p => p.id === teacher.imageId);
                return (
                    <Card key={teacher.name} className="text-center flex flex-col items-center p-6 transition-transform hover:scale-105 hover:shadow-lg">
                        <Avatar className="w-32 h-32 mb-4 border-4 border-primary">
                             {teacherImage && <AvatarImage src={teacherImage.imageUrl} alt={teacher.name} data-ai-hint={teacherImage.imageHint} />}
                             <AvatarFallback>{teacher.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <CardHeader className="p-0">
                            <CardTitle className="text-xl">{teacher.name}</CardTitle>
                        </CardHeader>
                    </Card>
                )
            })}
          </div>
           <div className="text-center pt-8">
                <Link href="/news">
                    <Button variant="link" className="text-primary">
                        Tüm Eğitim Kadromuz <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </Link>
            </div>
        </section>

        {/* Collabration Section */}

      </div>
      <Chatbot />
    </>
  );
}
