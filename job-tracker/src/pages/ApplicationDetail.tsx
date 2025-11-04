import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft, Trash2, Save } from 'lucide-react';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import StatusBadge from '@/components/StatusBadge';
import { z } from 'zod';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Application {
  id: string;
  company: string;
  position: string;
  status: 'applied' | 'interview' | 'offer' | 'rejected';
  notes: string | null;
  created_at: string;
}

const applicationSchema = z.object({
  company: z.string().trim().min(1, 'Company name is required').max(100),
  position: z.string().trim().min(1, 'Position is required').max(100),
  notes: z.string().max(1000).optional(),
});

const ApplicationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState('');
  const [position, setPosition] = useState('');
  const [status, setStatus] = useState<'applied' | 'interview' | 'offer' | 'rejected'>('applied');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user && id) {
      fetchApplication();
    }
  }, [user, id]);

  const fetchApplication = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      toast.error('Failed to load application');
      navigate('/applications');
    } else {
      setApplication(data as Application);
      setCompany(data.company);
      setPosition(data.position);
      setStatus(data.status as 'applied' | 'interview' | 'offer' | 'rejected');
      setNotes(data.notes || '');
    }
    setLoading(false);
  };

  const handleUpdate = async () => {
    try {
      applicationSchema.parse({ company, position, notes });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }

    setSubmitting(true);

    const { error } = await supabase
      .from('applications')
      .update({
        company: company.trim(),
        position: position.trim(),
        status,
        notes: notes.trim() || null,
      })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update application');
    } else {
      toast.success('Application updated successfully');
      fetchApplication();
    }
    setSubmitting(false);
  };

  const handleDelete = async () => {
    const { error } = await supabase.from('applications').delete().eq('id', id);

    if (error) {
      toast.error('Failed to delete application');
    } else {
      toast.success('Application deleted successfully');
      navigate('/applications');
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => navigate('/applications')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Applications
          </Button>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle>Edit Application</CardTitle>
                {application && <StatusBadge status={application.status} />}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="applied">Applied</SelectItem>
                    <SelectItem value="interview">Interview</SelectItem>
                    <SelectItem value="offer">Offer</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  maxLength={1000}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleUpdate} disabled={submitting} className="flex-1">
                  <Save className="mr-2 h-4 w-4" />
                  {submitting ? 'Saving...' : 'Save Changes'}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Application</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this application? This action cannot be undone
                        and will also delete all associated tasks.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default ApplicationDetail;
