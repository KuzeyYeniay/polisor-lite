
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { lessons } from '@/lib/data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function InstructorsPage() {
  // Create a unique list of teachers
  const teachers = lessons.reduce((acc, lesson) => {
    if (!acc.some(teacher => teacher.name === lesson.teacher)) {
      acc.push({
        name: lesson.teacher,
        imageId: lesson.teacherImageId,
        description: lesson.teacher_description,
      });
    }
    return acc;
  }, [] as { name: string; imageId: string; description: string}[]);

  return (
    <div className="container py-12 bg-gray-100 animate-fade-in">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold tracking-tight">Eğitmenlerimiz</h1>
        <p className="text-muted-foreground mt-2">Sizi başarıya ulaştıracak uzman ve deneyimli eğitmen kadromuzla tanışın.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12 max-w-4xl mx-auto">
        {teachers.map((teacher) => {
          const teacherImage = PlaceHolderImages.find((p) => p.id === teacher.imageId);
          return (
             <Card key={teacher.name} className="text-center flex flex-col items-center p-6 transition-transform hover:scale-105 hover:shadow-lg">
                <Avatar className="w-32 h-32 mb-4 border-4 border-primary">
                    {teacherImage && <AvatarImage src={teacherImage.imageUrl} alt={teacher.name} data-ai-hint={teacherImage.imageHint} />}
                    <AvatarFallback>{teacher.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <CardHeader className="p-0">
                    <CardTitle className="text-xl">{teacher.name}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">{teacher.description}</p>
                </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
