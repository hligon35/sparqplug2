import { CrudResourcePage } from '../components/CrudResourcePage';
import { WebScreen } from '../components/ui/WebScreen';

export function TasksPage() {
  return (
    <WebScreen title="Tasks">
      <CrudResourcePage
        title="Tasks"
        resourcePath="/tasks"
        createExample={{ title: 'Follow up', status: 'todo' }}
        showHeader={false}
      />
    </WebScreen>
  );
}
