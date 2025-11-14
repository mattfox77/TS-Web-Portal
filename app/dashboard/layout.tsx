import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { sql } from "@vercel/postgres";
import Link from "next/link";
import { 
  HomeIcon, 
  TicketIcon, 
  FolderIcon, 
  DocumentIcon, 
  CreditCardIcon,
  Cog6ToothIcon 
} from "@heroicons/react/24/outline";
import ImpersonationBanner from "@/components/ImpersonationBanner";

async function getImpersonationInfo() {
  const { userId } = auth();
  if (!userId) {
    return null;
  }

  const cookieStore = cookies();
  const impersonatingUserId = cookieStore.get('impersonating_user_id')?.value;
  const impersonatingAdminId = cookieStore.get('impersonating_admin_id')?.value;

  if (impersonatingUserId && impersonatingAdminId && userId === impersonatingAdminId) {
    // Get impersonated user info
    const result = await sql`
      SELECT email, first_name, last_name 
      FROM users 
      WHERE id = ${impersonatingUserId}
    `;
    
    const user = result.rows[0];

    if (user) {
      return {
        email: user.email,
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || undefined,
      };
    }
  }

  return null;
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const impersonationInfo = await getImpersonationInfo();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Impersonation Banner */}
      {impersonationInfo && (
        <ImpersonationBanner
          impersonatedUserEmail={impersonationInfo.email}
          impersonatedUserName={impersonationInfo.name}
        />
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-xl font-bold text-blue-600">
                Tech Support CS
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden md:flex md:flex-shrink-0">
          <div className="flex flex-col w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)]">
            <nav className="flex-1 px-4 py-6 space-y-1">
              <NavLink href="/dashboard" icon={HomeIcon}>
                Dashboard
              </NavLink>
              <NavLink href="/dashboard/tickets" icon={TicketIcon}>
                Support Tickets
              </NavLink>
              <NavLink href="/dashboard/projects" icon={FolderIcon}>
                Projects
              </NavLink>
              <NavLink href="/dashboard/documents" icon={DocumentIcon}>
                Documents
              </NavLink>
              <NavLink href="/dashboard/invoices" icon={CreditCardIcon}>
                Invoices
              </NavLink>
              <NavLink href="/dashboard/subscriptions" icon={CreditCardIcon}>
                Subscriptions
              </NavLink>
              <NavLink href="/dashboard/settings" icon={Cog6ToothIcon}>
                Settings
              </NavLink>
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function NavLink({ 
  href, 
  icon: Icon, 
  children 
}: { 
  href: string; 
  icon: React.ComponentType<{ className?: string }>; 
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors"
    >
      <Icon className="w-5 h-5" />
      {children}
    </Link>
  );
}
