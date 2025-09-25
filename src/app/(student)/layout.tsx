import StudentHeader from "@/components/student-header";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session.isLoggedIn || !session.user) {
    redirect('/login');
  }

  return (
    <div className="flex flex-col min-h-screen">
      <StudentHeader user={session.user} />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
