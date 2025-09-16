"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { lessons } from '@/lib/data';
import { Lock, Unlock, Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';

export default function StudentDashboard() {
  const { enrolledCourses, loading } = useAuth();

  if (loading) {
    return (
      <div className="container py-12">
        <div className="mb-10">
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-4 w-3/4 mt-2" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-1" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-10 w-full mt-4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-12">
      <div className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight">Student Dashboard</h1>
        <p className="text-muted-foreground mt-2">Your courses, materials, and progress.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {lessons.map((lesson) => {
          const isUnlocked = enrolledCourses.includes(lesson.id);
          const buttonLink = isUnlocked ? `/dashboard/student/lessons/${lesson.id}` : `/lessons/${lesson.id}`;
          return (
            <Card key={lesson.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{lesson.title}</CardTitle>
                      <CardDescription>{lesson.teacher}</CardDescription>
                    </div>
                    {isUnlocked ? (
                       <div className="flex items-center gap-2 text-green-600">
                        <Unlock className="h-4 w-4" />
                        <span className="text-xs font-semibold">Unlocked</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-destructive">
                        <Lock className="h-4 w-4" />
                        <span className="text-xs font-semibold">Locked</span>
                      </div>
                    )}
                </div>
              </CardHeader>
              <CardContent>
                <h4 className="font-semibold mb-2">Materials</h4>
                {!isUnlocked ? (
                  <div className="text-center text-muted-foreground bg-muted p-4 rounded-md">
                      <p>Enroll in this course to access materials.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                      <div className="flex justify-between items-center p-2 rounded-md hover:bg-muted">
                          <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-primary"/>
                              <span className="text-sm">Lecture_01.pdf</span>
                          </div>
                          <Button variant="ghost" size="icon" asChild>
                            <Link href="#" aria-label="Download material"><Download className="h-4 w-4"/></Link>
                          </Button>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded-md hover:bg-muted">
                           <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-primary"/>
                              <span className="text-sm">Assignment_1.docx</span>
                          </div>
                           <Button variant="ghost" size="icon" asChild>
                            <Link href="#" aria-label="Download material"><Download className="h-4 w-4"/></Link>
                          </Button>
                      </div>
                  </div>
                )}
                 <Link href={buttonLink} className="w-full">
                    <Button variant="outline" className="w-full mt-4">
                      {isUnlocked ? 'Go to Lesson Portal' : 'View Public Page'}
                    </Button>
                 </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
