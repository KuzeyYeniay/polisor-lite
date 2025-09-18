import { notFound } from 'next/navigation';
import Image from 'next/image';
import { lessons } from '@/lib/data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BookOpen, Clock, MapPin, User } from 'lucide-react';

export default function LessonDetailPage({ params }: { params: { id: string } }) {
  const lesson = lessons.find((l) => l.id === params.id);

  if (!lesson) {
    notFound();
  }

  const lessonImage = PlaceHolderImages.find((p) => p.id === lesson.imageId);

  return (
    <div className="container py-12">
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
            {lessonImage && (
                <div className="relative h-64 md:h-96 w-full rounded-lg overflow-hidden mb-8">
                <Image
                    src={lessonImage.imageUrl}
                    alt={lesson.title}
                    fill
                    className="object-cover"
                    data-ai-hint={lessonImage.imageHint}
                />
                </div>
            )}
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-primary"/>
                {lesson.title}
            </h1>
            <p className="text-lg text-muted-foreground flex items-center gap-2 mb-4">
                <User className="w-5 h-5" />
                {lesson.teacher}
            </p>
            <p className="text-base leading-relaxed">{lesson.description_long}</p>
        </div>
        <div className="md:col-span-1">
            <Card>
                <CardHeader>
                    <CardTitle>Akademik Takvim</CardTitle>
                    <CardDescription>Haftalık Takvim</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Gün</TableHead>
                            <TableHead>Saat</TableHead>
                            <TableHead>Platform</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {lesson.calendar.map((slot, index) => (
                            <TableRow key={index}>
                            <TableCell className="font-medium">{slot.day}</TableCell>
                            <TableCell>
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <Clock className="w-3.5 h-3.5"/>
                                    {slot.time}
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <MapPin className="w-3.5 h-3.5"/>
                                    {slot.room}
                                </div>
                            </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
