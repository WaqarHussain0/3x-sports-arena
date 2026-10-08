import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { Topbar } from '@/components/layout/Topbar';

export default async function AdminLayout({ children }: LayoutProps<'/'>) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-w-0">
        <Topbar user={{ name: session.user.name, email: session.user.email }} />
        <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
