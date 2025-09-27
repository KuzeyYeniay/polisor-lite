
"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { lessons, type TeacherMaterial } from '@/lib/data';
import { PlusCircle, MoreVertical, Trash2, Edit, AlertTriangle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const uploadSchema = z.object({
  lessonId: z.string().min(1, 'Please select a lesson.'),
  file: z.any().refine((files) => files?.length === 1, 'File is required.'),
});

export default function TeacherDashboard() {
  const [materials, setMaterials] = useState<TeacherMaterial[]>([]);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState<TeacherMaterial | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();

  const form = useForm<z.infer<typeof uploadSchema>>({
    resolver: zodResolver(uploadSchema),
  });

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/auth');
      } else if (role !== 'teacher') {
        router.push('/dashboard/student');
      }
    }
  }, [user, role, authLoading, router]);

  useEffect(() => {
    if (role === 'teacher') {
      setIsLoading(true);
      const unsubscribe = onSnapshot(collection(db, 'materials'), (snapshot) => {
        const materialsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TeacherMaterial));
        setMaterials(materialsData);
        setIsLoading(false);
      }, (error) => {
        console.error("Error fetching materials:", error);
        toast({
          title: "Error",
          description: "Failed to fetch materials.",
          variant: "destructive",
        });
        setIsLoading(false);
      });
      return () => unsubscribe();
    }
  }, [role, toast]);
  
  const handleUpload = async (values: z.infer<typeof uploadSchema>) => {
    const file = values.file[0];
    if (!file) return;

    try {
      const storagePath = `materials/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, storagePath);
      const uploadResult = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(uploadResult.ref);

      const lesson = lessons.find(l => l.id === values.lessonId);
      if (!lesson) {
        toast({ title: "Error", description: "Selected lesson not found.", variant: "destructive" });
        return;
      }
      
      const newMaterial = {
        lesson: lesson.title,
        fileName: file.name,
        fileType: file.type || 'Unknown',
        uploadDate: new Date().toISOString().split('T')[0],
        downloadURL: downloadURL,
        storagePath: storagePath,
      };

      await addDoc(collection(db, 'materials'), newMaterial);

      toast({ title: "Success", description: "Material uploaded successfully." });
      setIsUploadDialogOpen(false);
      form.reset();
    } catch (error) {
      console.error("Upload error:", error);
      toast({ title: "Upload Failed", description: "An error occurred while uploading the file.", variant: "destructive" });
    }
  };
  
  const handleDelete = async () => {
    if (!materialToDelete) return;

    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'materials', materialToDelete.id));

      // Delete from Storage
      if (materialToDelete.storagePath) {
        const fileRef = ref(storage, materialToDelete.storagePath);
        await deleteObject(fileRef);
      }
      
      toast({ title: "Success", description: "Material deleted successfully." });
    } catch (error) {
       console.error("Delete error:", error);
       toast({ title: "Delete Failed", description: "An error occurred while deleting the material.", variant: "destructive" });
    } finally {
        setMaterialToDelete(null);
        setIsDeleteDialogOpen(false);
    }
  };
  
  const openDeleteDialog = (material: TeacherMaterial) => {
    setMaterialToDelete(material);
    setIsDeleteDialogOpen(true);
  };


  if (authLoading || role !== 'teacher') {
    return (
      <div className="container flex items-center justify-center min-h-[calc(100vh-10rem)]">
        {authLoading ? (
            <div className="w-full max-w-4xl space-y-8">
                <Skeleton className="h-12 w-1/3" />
                <Skeleton className="h-48 w-full" />
            </div>
        ) : (
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-2"><AlertTriangle className="text-destructive h-6 w-6"/> Access Denied</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">You do not have permission to view this page. This area is for teachers only.</p>
              <Button asChild className="mt-6">
                <Link href="/dashboard/student">Go to Student Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="container py-12">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Teacher Dashboard</h1>
          <p className="text-muted-foreground mt-2">Manage your academic materials.</p>
        </div>
        <Button onClick={() => setIsUploadDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Upload Material
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Uploaded Materials</CardTitle>
          <CardDescription>A list of all materials you have uploaded for your courses.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
             </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File Name</TableHead>
                  <TableHead>Lesson</TableHead>
                  <TableHead>File Type</TableHead>
                  <TableHead>Upload Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materials.map((material) => (
                  <TableRow key={material.id}>
                    <TableCell className="font-medium">{material.fileName}</TableCell>
                    <TableCell>{material.lesson}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{material.fileType}</Badge>
                    </TableCell>
                    <TableCell>{material.uploadDate}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem disabled>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => openDeleteDialog(material)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Upload New Material</DialogTitle>
            <DialogDescription>Select a course and a file to upload.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleUpload)} className="space-y-4">
              <FormField
                control={form.control}
                name="lessonId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lesson</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a lesson to upload to" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {lessons.map((lesson) => (
                          <SelectItem key={lesson.id} value={lesson.id}>{lesson.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                  control={form.control}
                  name="file"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>File</FormLabel>
                      <FormControl>
                        <Input type="file" {...form.register('file')} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              <DialogFooter>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                   {form.formState.isSubmitting ? "Uploading..." : "Upload"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the material
                <span className="font-bold"> {materialToDelete?.fileName}</span> and remove the file from storage.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                Delete
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </div>
  );
}

    