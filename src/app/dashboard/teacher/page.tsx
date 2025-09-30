
"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { lessons, type TeacherMaterial } from '@/lib/data';
import { PlusCircle, MoreVertical, Trash2, Edit, AlertTriangle, Folder, File } from 'lucide-react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, deleteDoc, doc, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';

const uploadSchema = z.object({
  lessonId: z.string().min(1, 'Please select a lesson.'),
  displayName: z.string().min(1, 'Display name is required.'),
  folderName: z.string().optional(),
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
    defaultValues: {
      lessonId: '',
      displayName: '',
      folderName: '',
      file: undefined,
    }
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
        const materialsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TeacherMaterial)).sort((a, b) => (a.order || 0) - (b.order || 0));
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
      const lesson = lessons.find(l => l.id === values.lessonId);
      if (!lesson) {
        toast({ title: "Error", description: "Selected lesson not found.", variant: "destructive" });
        return;
      }

      const q = query(collection(db, 'materials'), where("lesson", "==", lesson.title));
      const querySnapshot = await getDocs(q);
      const newOrder = querySnapshot.size;

      const storagePath = `materials/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, storagePath);
      const uploadResult = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(uploadResult.ref);
      
      const newMaterial = {
        lesson: lesson.title,
        displayName: values.displayName,
        folder: values.folderName || '',
        fileName: file.name,
        fileType: file.type || 'Unknown',
        uploadDate: new Date().toISOString().split('T')[0],
        downloadURL: downloadURL,
        storagePath: storagePath,
        order: newOrder,
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
      await deleteDoc(doc(db, 'materials', materialToDelete.id));
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

  const groupedMaterials = materials.reduce((acc, material) => {
    const key = material.folder || 'Uncategorized';
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(material);
    return acc;
  }, {} as Record<string, TeacherMaterial[]>);


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
          ) : materials.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <p>No materials uploaded yet. Click "Upload Material" to get started.</p>
            </div>
          ) : (
            <Accordion type="multiple" defaultValue={Object.keys(groupedMaterials)} className="w-full">
              {Object.entries(groupedMaterials).map(([folderName, folderMaterials]) => (
                <AccordionItem value={folderName} key={folderName}>
                  <AccordionTrigger className="text-lg font-medium hover:no-underline">
                    <div className="flex items-center gap-2">
                      {folderName !== 'Uncategorized' && <Folder className="h-5 w-5 text-primary" />}
                      {folderName}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 pl-4">
                      {folderMaterials.map((material) => (
                        <div key={material.id} className="flex justify-between items-center p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <File className="h-5 w-5 text-primary/80" />
                            <div>
                              <p className="font-medium">{material.displayName}</p>
                              <p className="text-xs text-muted-foreground">{material.lesson} - {material.fileName}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                             <Badge variant="secondary">{material.fileType}</Badge>
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
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>

      <Dialog open={isUploadDialogOpen} onOpenChange={(isOpen) => {
        setIsUploadDialogOpen(isOpen);
        if (!isOpen) form.reset();
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Upload New Material</DialogTitle>
            <DialogDescription>Select a course and a file to upload. Add a display name and an optional folder.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleUpload)} className="space-y-4 pt-4">
              <FormField
                control={form.control}
                name="lessonId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lesson</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a lesson" />
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
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Week 1 Lecture Notes" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="folderName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Folder Name (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Midterm 1 Prep" {...field} />
                    </FormControl>
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
                <Button type="button" variant="outline" onClick={() => setIsUploadDialogOpen(false)}>Cancel</Button>
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
                <span className="font-bold"> "{materialToDelete?.displayName}"</span> and remove the file from storage.
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
