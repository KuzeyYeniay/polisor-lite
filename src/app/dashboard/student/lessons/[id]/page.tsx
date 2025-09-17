"use client";

import { useEffect, useState } from 'react';
import { notFound, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { lessons, type Lesson } from '@/lib/data';
import type { TeacherMaterial } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, FileText, AlertTriangle, BookOpen, BrainCircuit } from 'lucide-react';
import Link from 'next/link';

export default function StudentLessonPortal() {
  const params = useParams();
  const { id } = params;
  const { user, enrolledCourses, loading: authLoading } = useAuth();
  
  const [materials, setMaterials] = useState<TeacherMaterial[]>([]);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching materials:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [isEnrolled, lesson, authLoading]);

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
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
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
          <CardTitle>Course Materials</CardTitle>
          <CardDescription>All materials uploaded by your teacher for this lesson.</CardDescription>
        </CardHeader>
        <CardContent>
           <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date Uploaded</TableHead>
                  <TableHead className="text-right">Download</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materials.length > 0 ? (
                  materials.map((material) => (
                    <TableRow key={material.id}>
                      <TableCell className="font-medium flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground"/>
                        {material.fileName}
                      </TableCell>
                      <TableCell>{material.fileType}</TableCell>
                      <TableCell>{material.uploadDate}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" asChild>
                           <a href={material.downloadURL} target="_blank" rel="noopener noreferrer">
                                <Download className="h-4 w-4" />
                           </a>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      No materials have been uploaded for this course yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
        </CardContent>
      </Card>

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
