import { Link, Outlet, useLocation } from 'react-router-dom';
import { APP_NAME } from '@sparq2/shared';
import { useAuth } from '../hooks/useAuth';

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
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <aside style={{ width: 220, padding: 16, borderRight: '1px solid #eee' }}>
        <div style={{ fontWeight: 700, marginBottom: 12 }}>{APP_NAME}</div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              style={{
                textDecoration: 'none',
                color: pathname === l.to ? '#111' : '#444',
                fontWeight: pathname === l.to ? 700 : 400
              }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div style={{ marginTop: 16, fontSize: 12, color: '#555' }}>{user?.email}</div>
        <button style={{ marginTop: 8 }} onClick={() => logout()}>
          Logout
        </button>
      </aside>

      <main style={{ flex: 1, padding: 16 }}>
        <Outlet />
      </main>
    </div>
  );
}
