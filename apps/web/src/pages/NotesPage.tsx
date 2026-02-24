import { CrudResourcePage } from '../components/CrudResourcePage';

export function NotesPage() {
  return (
    <CrudResourcePage
      title="Notes"
      resourcePath="/notes"
      createExample={{ title: 'Meeting notes', body: '...' }}
    />
  );
}
