
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Failed to fetch students');
      const data = await response.json();
      setStudents(data);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: (error as Error).message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprovalChange = async (studentId: string, isApproved: boolean) => {
    try {
      const response = await fetch(`/api/users/${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved }),
      });

      if (!response.ok) {
        throw new Error('Failed to update student status');
      }

      setStudents(students.map(s => s.id === studentId ? { ...s, isApproved } : s));
      toast({
        title: 'Success',
        description: 'Student approval status updated.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: (error as Error).message,
      });
      // Revert UI on failure
      setStudents(students.map(s => s.id === studentId ? { ...s, isApproved: !isApproved } : s));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-headline font-bold">Manage Students</h1>
        <p className="text-muted-foreground">View student details and manage their approval status.</p>
      </div>

      <Card>
        <CardContent className="p-0 md:p-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <Table className="hidden md:table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Approve</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={`/avatars/${student.id}.png`} alt="Avatar" />
                            <AvatarFallback>{student.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{student.name}</div>
                            <div className="text-sm text-muted-foreground">{student.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={student.isApproved ? 'default' : 'secondary'} className={student.isApproved ? 'bg-accent text-accent-foreground' : ''}>
                          {student.isApproved ? 'Approved' : 'Pending'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Switch
                          checked={student.isApproved}
                          onCheckedChange={(checked) => handleApprovalChange(student.id, checked)}
                          aria-label="Approval status"
                          id={`approve-${student.id}-desktop`}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {/* Mobile Card View */}
              <div className="grid gap-4 md:hidden p-4">
                {students.map((student) => (
                  <Card key={student.id}>
                    <CardHeader>
                       <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={`/avatars/${student.id}.png`} alt="Avatar" />
                          <AvatarFallback>{student.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-base">{student.name}</CardTitle>
                          <CardDescription>{student.email}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardFooter className="flex justify-between items-center">
                      <div>
                        <Badge variant={student.isApproved ? 'default' : 'secondary'} className={student.isApproved ? 'bg-accent text-accent-foreground' : ''}>
                          {student.isApproved ? 'Approved' : 'Pending'}
                        </Badge>
                      </div>
                       <div className="flex items-center space-x-2">
                        <Label htmlFor={`approve-${student.id}-mobile`}>Approve</Label>
                        <Switch
                          id={`approve-${student.id}-mobile`}
                          checked={student.isApproved}
                          onCheckedChange={(checked) => handleApprovalChange(student.id, checked)}
                          aria-label="Approval status"
                        />
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
