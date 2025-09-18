"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { notFound, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { lessons, type Lesson } from '@/lib/data';
import type { TeacherMaterial } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, FileText, AlertTriangle, BookOpen, BrainCircuit, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export default function StudentLessonPortal() {
  const params = useParams();
  const { id } = params;
  const { user, enrolledCourses, loading: authLoading } = useAuth();
  
  const [materials, setMaterials] = useState<TeacherMaterial[]>([]);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<TeacherMaterial | null>(null);


  const isEnrolled = enrolledCourses.includes(id as string);

  useEffect(() => {
    const currentLesson = lessons.find(l => l.id === id);
    if (currentLesson) {
      setLesson(currentLesson);
    } else {
       if (!authLoading) notFound();
    }
  }, [id, authLoading]);

  useEffect(() => {
    if (!isEnrolled || !lesson) {
      if (!authLoading) setIsLoading(false);
      return;
    };

    const q = query(collection(db, "materials"), where("lesson", "==", lesson.title));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const materialsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TeacherMaterial));
      setMaterials(materialsData);
      
      // Set the first image as the default selected image
      const firstImage = materialsData.find(m => m.fileType.startsWith('image/'));
      setSelectedImage(firstImage || null);
      
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching materials:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [isEnrolled, lesson, authLoading]);

  const imageMaterials = materials.filter(m => m.fileType.startsWith('image/') || m.fileType.startsWith('application/pdf'));
  const otherMaterials = materials.filter(m => !m.fileType.startsWith('image/') && !m.fileType.startsWith('application/pdf'));

  if (authLoading || (isLoading && isEnrolled)) {
    return (
      <div className="container py-12">
        <Skeleton className="h-10 w-1/2 mb-2" />
        <Skeleton className="h-4 w-1/4 mb-8" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/3" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-1">
                    <div className="space-y-2">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                </div>
                <div className="md:col-span-3">
                    <Skeleton className="h-[40rem] w-full" />
                </div>
            </div>
          </CardContent>
        </Card>
         {id === 'circuit-design' && (
          <div className="mt-8">
            <Skeleton className="h-20 w-full" />
          </div>
        )}
      </div>
    );
  }

  if (!isEnrolled) {
    return (
       <div className="container flex items-center justify-center min-h-[calc(100vh-10rem)]">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-2"><AlertTriangle className="text-destructive h-6 w-6"/> Access Denied</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">You are not enrolled in this course. Access to materials is restricted.</p>
              <Button asChild className="mt-6">
                <Link href="/dashboard/student">Back to Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
    )
  }

  if (!lesson) {
     if (!authLoading) notFound();
     return null;
  }

  return (
    <div className="container py-12">
       <div className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-primary"/>
          {lesson.title}
        </h1>
        <p className="text-muted-foreground mt-2">Welcome to your private portal for this lesson.</p>
      </div>

       <Card>
        <CardHeader>
          <CardTitle>Image Gallery</CardTitle>
          <CardDescription>Select an image to view it.</CardDescription>
        </CardHeader>
        <CardContent>
            {imageMaterials.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="md:col-span-1">
                        <ScrollArea className="h-[40rem] pr-4">
                            <div className="space-y-2">
                            {imageMaterials.map(material => (
                                <button key={material.id} onClick={() => setSelectedImage(material)} className={cn("w-full text-left p-3 rounded-lg border transition-colors flex items-center gap-3", selectedImage?.id === material.id ? "bg-muted border-primary" : "hover:bg-muted/50")}>
                                    <ImageIcon className="h-5 w-5 text-primary"/>
                                    <span className="flex-1 truncate">{material.fileName}</span>
                                </button>
                            ))}
                            </div>
                        </ScrollArea>
                    </div>
                    <div className="md:col-span-3">
                        {selectedImage ? (
                             <div 
                                className="relative h-[40rem] w-full bg-muted rounded-lg flex items-center justify-center overflow-hidden border"
                                onContextMenu={(e) => e.preventDefault()}
                                onDragStart={(e) => e.preventDefault()}
                              >
                                {selectedImage.downloadURL && (
                                  <Image 
                                    src={selectedImage.downloadURL} 
                                    alt={selectedImage.fileName} 
                                    fill 
                                    style={{ objectFit: 'contain' }}
                                    className="p-4"
                                  />
                                )}
                             </div>
                        ) : (
                            <div className="h-[40rem] w-full bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                                <p>No image selected.</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="h-48 flex items-center justify-center text-muted-foreground bg-muted/50 rounded-lg">
                    <p>No image materials have been uploaded for this course yet.</p>
                </div>
            )}
        </CardContent>
      </Card>
      
      {otherMaterials.length > 0 && (
         <Card className="mt-8">
            <CardHeader>
                <CardTitle>Other Materials</CardTitle>
                <CardDescription>Additional downloadable files for this lesson.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="space-y-2">
                {otherMaterials.map((material) => (
                    <div key={material.id} className="flex justify-between items-center p-3 rounded-lg border hover:bg-muted/50">
                        <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-primary"/>
                            <div>
                                <p className="font-medium">{material.fileName}</p>
                                <p className="text-xs text-muted-foreground">{material.fileType}</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" asChild>
                            <a href={material.downloadURL} target="_blank" rel="noopener noreferrer" aria-label={`Download ${material.fileName}`}>
                                <Download className="h-5 w-5" />
                            </a>
                        </Button>
                    </div>
                ))}
                </div>
            </CardContent>
        </Card>
      )}


      {id === 'circuit-design' && (
        <Card className="mt-8">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BrainCircuit className="w-6 h-6 text-primary"/>
                    Test Your Knowledge
                </CardTitle>
                <CardDescription>Take a practice quiz to check your understanding of the material.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground mb-4">You'll be presented with 15 random questions from the question bank. Good luck!</p>
                <Button asChild>
                    <Link href={`/dashboard/student/quiz/${id}`}>Start Quiz</Link>
                </Button>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
