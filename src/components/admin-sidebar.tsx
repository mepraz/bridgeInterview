
'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Home, FileQuestion, Users, ClipboardList } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import Logo from '@/components/logo';
import type { User } from '@/lib/types';

const SidebarContent = ({ user }: { user: Omit<User, 'password'> }) => {
  const router = useRouter();

  const handleLogout = async () => {
      await fetch('/api/auth/logout');
      router.push('/');
      router.refresh();
  };

  return (
    <>
      <div className="h-16 flex items-center px-6 border-b">
        <Logo />
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        <Link
          href="/admin/dashboard"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
        >
          <Home className="h-4 w-4" />
          Dashboard
        </Link>
        <Link
          href="/admin/students"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
        >
          <Users className="h-4 w-4" />
          Students
        </Link>
        <Link
          href="/admin/questions"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
        >
          <FileQuestion className="h-4 w-4" />
          Questions
        </Link>
        <Link
          href="/admin/test-sessions"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
        >
          <ClipboardList className="h-4 w-4" />
          Test Sessions
        </Link>
      </nav>
      <div className="mt-auto p-4 border-t">
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={`/avatars/${user.id}.png`} alt={user.name} />
                    <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium">{user.name}</span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel>Admin Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
      </div>
    </>
  );
}

const AdminSidebar = ({ user }: { user: Omit<User, 'password'> }) => {
  return (
    <aside className="w-64 flex-shrink-0 border-r bg-muted/20 flex flex-col h-screen">
      <SidebarContent user={user} />
    </aside>
  );
};

export default AdminSidebar;
export { SidebarContent };
