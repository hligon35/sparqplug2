import { CrudResourcePage } from '../components/CrudResourcePage';

export function TasksPage() {
  return (
    <CrudResourcePage
      title="Tasks"
      resourcePath="/tasks"
      createExample={{ title: 'Follow up', status: 'todo' }}
    />
  );
}
