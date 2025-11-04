import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { LayoutDashboard, Briefcase, CheckSquare, LogOut } from 'lucide-react';

const Navbar = () => {
  const { signOut, user } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="text-xl font-bold text-primary">
              JobTracker
            </Link>
            {user && (
              <div className="flex gap-1">
                <Link to="/">
                  <Button
                    variant={isActive('/') ? 'secondary' : 'ghost'}
                    size="sm"
                    className="gap-2"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
                <Link to="/applications">
                  <Button
                    variant={isActive('/applications') ? 'secondary' : 'ghost'}
                    size="sm"
                    className="gap-2"
                  >
                    <Briefcase className="h-4 w-4" />
                    Applications
                  </Button>
                </Link>
                <Link to="/tasks">
                  <Button
                    variant={isActive('/tasks') ? 'secondary' : 'ghost'}
                    size="sm"
                    className="gap-2"
                  >
                    <CheckSquare className="h-4 w-4" />
                    Tasks
                  </Button>
                </Link>
              </div>
            )}
          </div>
          {user && (
            <Button variant="ghost" size="sm" onClick={signOut} className="gap-2">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
