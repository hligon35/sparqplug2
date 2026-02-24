import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

import logo from '../assets/sparqpluglogo.png';
import { Button } from './ui/Button';

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/clients', label: 'Clients' },
  { to: '/tasks', label: 'Tasks' },
  { to: '/notes', label: 'Notes' },
  { to: '/files', label: 'Files' },
  { to: '/billing', label: 'Billing' }
];

export function Layout() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen">
      <div className="h-[56px] border-b border-gray-200 bg-white">
        <div className="h-full px-4 flex items-center justify-between max-w-[1200px] mx-auto">
          <div className="flex items-center gap-3">
            <img src={logo} alt="SparQ Plug" className="w-8 h-8 object-contain" />
            <div className="font-bold text-[#111827]">SparQ Plug</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-sm opacity-70">{user?.email}</div>
            <Button variant="ghost" onClick={() => logout()}>
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="flex">
        <aside className="hidden lg:block w-[280px] border-r border-gray-200 bg-white min-h-[calc(100vh-56px)]">
          <nav className="p-4 flex flex-col gap-1">
            {links.map((l) => {
              const active = pathname === l.to || (l.to === '/dashboard' && pathname === '/');
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className={`rounded-2xl px-4 py-3 font-semibold ${
                    active ? 'bg-gray-100 text-[#111827]' : 'text-[#111827] opacity-70 hover:opacity-100'
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
