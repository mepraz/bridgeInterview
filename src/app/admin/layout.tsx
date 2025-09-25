import AdminHeader from "@/components/admin-header";
import AdminSidebar from "@/components/admin-sidebar";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== 'admin' || !session.user) {
    redirect('/login?admin=true');
  }
  
  return (
    <div className="flex min-h-screen">
      <div className="hidden md:block">
        <AdminSidebar user={session.user} />
      </div>
      <div className="flex-1 flex flex-col">
        <AdminHeader user={session.user} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
