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
import { toast } from 'sonner';
import { Plus, Building2, Briefcase } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import StatusBadge from '@/components/StatusBadge';
import { z } from 'zod';

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

const Applications = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [company, setCompany] = useState('');
  const [position, setPosition] = useState('');
  const [status, setStatus] = useState<'applied' | 'interview' | 'offer' | 'rejected'>('applied');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchApplications();
    }
  }, [user]);

  const fetchApplications = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load applications');
    } else {
      setApplications((data || []) as Application[]);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      applicationSchema.parse({ company, position, notes });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }

    setSubmitting(true);

    const { error } = await supabase.from('applications').insert({
      user_id: user?.id,
      company: company.trim(),
      position: position.trim(),
      status,
      notes: notes.trim() || null,
    });

    if (error) {
      toast.error('Failed to create application');
    } else {
      toast.success('Application created successfully');
      setOpen(false);
      setCompany('');
      setPosition('');
      setStatus('applied');
      setNotes('');
      fetchApplications();
    }
    setSubmitting(false);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Applications</h1>
              <p className="text-muted-foreground">Manage your job applications</p>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Application
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Application</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="Acme Corp"
                      required
                      maxLength={100}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position">Position</Label>
                    <Input
                      id="position"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      placeholder="Software Engineer"
                      required
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
                    {submitting ? 'Creating...' : 'Create Application'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading applications...</div>
          ) : applications.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No applications yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start tracking your job applications by creating your first one.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {applications.map((app) => (
                <Link key={app.id} to={`/applications/${app.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-primary" />
                            {app.company}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Briefcase className="h-4 w-4" />
                            {app.position}
                          </CardDescription>
                        </div>
                        <StatusBadge status={app.status} />
                      </div>
                    </CardHeader>
                    {app.notes && (
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-2">{app.notes}</p>
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

export default Applications;
