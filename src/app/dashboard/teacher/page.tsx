import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { teacherMaterials } from '@/lib/data';
import { PlusCircle, MoreVertical, Trash2, Edit } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';


export default function TeacherDashboard() {
  return (
    <div className="container py-12">
      <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Teacher Dashboard</h1>
            <p className="text-muted-foreground mt-2">Manage your academic materials.</p>
          </div>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Upload Material
          </Button>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Uploaded Materials</CardTitle>
            <CardDescription>A list of all materials you have uploaded for your courses.</CardDescription>
        </CardHeader>
        <CardContent>
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
                    {teacherMaterials.map((material) => (
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
                                <DropdownMenuItem>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">
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
        </CardContent>
      </Card>
    </div>
  );
}
