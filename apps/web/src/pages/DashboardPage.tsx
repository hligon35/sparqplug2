import { APP_NAME, APP_VERSION } from '@sparq2/shared';

export function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>
      <p>
        {APP_NAME} v{APP_VERSION}
      </p>
    </div>
  );
}
