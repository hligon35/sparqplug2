import { APP_VERSION } from '@sparq2/shared';

import { WebScreen } from '../components/ui/WebScreen';
import { Card } from '../components/ui/Card';
import { SectionHeader } from '../components/ui/SectionHeader';
import { ListRow } from '../components/ui/ListRow';
import { Badge } from '../components/ui/Badge';
import { useNavigate } from 'react-router-dom';

export function DashboardPage() {
  const navigate = useNavigate();

  return (
    <WebScreen title="Dashboard" statusText={`v${APP_VERSION}`}>
      <div className="rounded-2xl bg-[#4F46E5] p-4">
        <div className="flex items-center justify-between">
          <div className="text-white font-bold text-base">Upcoming Meet</div>
          <Badge variant="indigo" label="Join" />
        </div>
        <div className="text-white/90 mt-1 text-sm">SparQ Plug</div>
      </div>

      <Card>
        <SectionHeader title="Quick access" subtitle="Jump into work" />
        <div className="mt-2">
          <ListRow title="Clients" onClick={() => navigate('/clients')} />
          <ListRow title="Tasks" onClick={() => navigate('/tasks')} />
          <ListRow title="Notes" onClick={() => navigate('/notes')} />
          <ListRow title="Files" onClick={() => navigate('/files')} showDivider={false} />
        </div>
      </Card>
    </WebScreen>
  );
}
