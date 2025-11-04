import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Plus, CheckSquare, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { z } from 'zod';
import { format } from 'date-fns';

interface Task {
  id: string;
  title: string;
  due_date: string | null;
  completed: boolean;
  notes: string | null;
  application_id: string;
  applications?: {
    company: string;
    position: string;
  };
}

interface Application {
  id: string;
  company: string;
  position: string;
}

const taskSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  notes: z.string().max(1000).optional(),
});

const Tasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [applicationId, setApplicationId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchTasks();
      fetchApplications();
    }
  }, [user]);

  const fetchTasks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        applications (
          company,
          position
        )
      `)
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load tasks');
    } else {
      setTasks((data || []) as Task[]);
    }
    setLoading(false);
  };

  const fetchApplications = async () => {
    const { data, error } = await supabase
      .from('applications')
      .select('id, company, position')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setApplications(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      taskSchema.parse({ title, notes });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }

    if (!applicationId) {
      toast.error('Please select an application');
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from('tasks').insert({
      user_id: user?.id,
      application_id: applicationId,
      title: title.trim(),
      due_date: dueDate || null,
      notes: notes.trim() || null,
    });

    if (error) {
      toast.error('Failed to create task');
    } else {
      toast.success('Task created successfully');
      setOpen(false);
      setTitle('');
      setApplicationId('');
      setDueDate('');
      setNotes('');
      fetchTasks();
    }
    setSubmitting(false);
  };

  const toggleComplete = async (task: Task) => {
    const { error } = await supabase
      .from('tasks')
      .update({ completed: !task.completed })
      .eq('id', task.id);

    if (error) {
      toast.error('Failed to update task');
    } else {
      fetchTasks();
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Tasks</h1>
              <p className="text-muted-foreground">Manage your job search tasks</p>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Task
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Task</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="application">Application</Label>
                    <Select value={applicationId} onValueChange={setApplicationId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select application..." />
                      </SelectTrigger>
                      <SelectContent>
                        {applications.map((app) => (
                          <SelectItem key={app.id} value={app.id}>
                            {app.company} - {app.position}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Task Title</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Follow up on application"
                      required
                      maxLength={200}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date (optional)</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (optional)</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Additional details..."
                      maxLength={1000}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? 'Creating...' : 'Create Task'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading tasks...</div>
          ) : tasks.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No tasks yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first task to stay organized in your job search.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {tasks.map((task) => (
                <Link key={task.id} to={`/tasks/${task.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <div className="pt-1" onClick={(e) => e.preventDefault()}>
                          <Checkbox
                            checked={task.completed}
                            onCheckedChange={() => toggleComplete(task)}
                          />
                        </div>
                        <div className="flex-1">
                          <CardTitle className={task.completed ? 'line-through text-muted-foreground' : ''}>
                            {task.title}
                          </CardTitle>
                          {task.applications && (
                            <CardDescription className="mt-1">
                              {task.applications.company} - {task.applications.position}
                            </CardDescription>
                          )}
                        </div>
                        {task.due_date && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(task.due_date), 'MMM d, yyyy')}
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    {task.notes && (
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-2">{task.notes}</p>
                      </CardContent>
                    )}
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default Tasks;
