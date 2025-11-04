import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'applied' | 'interview' | 'offer' | 'rejected';
}

const StatusBadge = ({ status }: StatusBadgeProps) => {
  const variants = {
    applied: 'bg-primary/10 text-primary hover:bg-primary/20',
    interview: 'bg-warning/10 text-warning hover:bg-warning/20',
    offer: 'bg-success/10 text-success hover:bg-success/20',
    rejected: 'bg-destructive/10 text-destructive hover:bg-destructive/20',
  };

  const labels = {
    applied: 'Applied',
    interview: 'Interview',
    offer: 'Offer',
    rejected: 'Rejected',
  };

  return (
    <Badge variant="secondary" className={cn(variants[status])}>
      {labels[status]}
    </Badge>
  );
};

export default StatusBadge;
