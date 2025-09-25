
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Question } from '@/lib/types';
import { PlusCircle, Edit, Trash2, Loader2, Timer, Gauge } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/questions');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setQuestions(data);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch questions.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddOrUpdateQuestion = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const questionData = {
      text: formData.get('text') as string,
      timer: Number(formData.get('timer')),
      difficulty: Number(formData.get('difficulty')),
    };

    const url = editingQuestion ? `/api/questions/${editingQuestion.id}` : '/api/questions';
    const method = editingQuestion ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(questionData),
      });

      if (!response.ok) {
        throw new Error(editingQuestion ? 'Failed to update question' : 'Failed to add question');
      }

      toast({
        title: 'Success',
        description: `Question successfully ${editingQuestion ? 'updated' : 'added'}.`,
      });

      fetchQuestions(); // Refresh the list
      setIsDialogOpen(false);
      setEditingQuestion(null);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: (error as Error).message,
      });
    }
  };

  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
    setIsDialogOpen(true);
  };

  const handleDelete = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
      const response = await fetch(`/api/questions/${questionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete question');
      }

      toast({
        title: 'Success',
        description: 'Question successfully deleted.',
      });

      fetchQuestions(); // Refresh the list
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Error',
        description: (error as Error).message,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-headline font-bold">Manage Questions</h1>
          <p className="text-muted-foreground">Add, edit, or remove mock test questions.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(isOpen) => {
          setIsDialogOpen(isOpen);
          if (!isOpen) setEditingQuestion(null);
        }}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2" />
              Add Question
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingQuestion ? 'Edit Question' : 'Add New Question'}</DialogTitle>
              <DialogDescription>
                {editingQuestion ? 'Update the details of the existing question.' : 'Fill in the details for the new question.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddOrUpdateQuestion} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="text">Question Text</Label>
                <Textarea id="text" name="text" required defaultValue={editingQuestion?.text}/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timer">Timer (seconds)</Label>
                  <Input id="timer" name="timer" type="number" required defaultValue={editingQuestion?.timer}/>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty (1-10)</Label>
                  <Input id="difficulty" name="difficulty" type="number" min="1" max="10" required defaultValue={editingQuestion?.difficulty}/>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">{editingQuestion ? 'Save Changes' : 'Add Question'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
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
                    <TableHead className="w-[60%]">Question Text</TableHead>
                    <TableHead>Timer</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {questions.length > 0 ? questions.map((question) => (
                    <TableRow key={question.id}>
                      <TableCell>{question.text}</TableCell>
                      <TableCell>{question.timer}s</TableCell>
                      <TableCell>{question.difficulty}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(question)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(question.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        No questions found. Add one to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {/* Mobile Card View */}
              <div className="grid gap-4 md:hidden p-4">
                {questions.length > 0 ? questions.map((question) => (
                  <Card key={question.id}>
                    <CardContent className="pt-6">
                      <p className="text-muted-foreground">{question.text}</p>
                    </CardContent>
                    <CardFooter className="flex justify-between items-center">
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Timer className="h-4 w-4" />
                          <span>{question.timer}s</span>
                        </div>
                         <div className="flex items-center gap-1">
                          <Gauge className="h-4 w-4" />
                          <span>{question.difficulty}</span>
                        </div>
                      </div>
                      <div>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(question)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(question.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                )) : (
                  <div className="h-24 text-center flex items-center justify-center">
                    <p>No questions found.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
