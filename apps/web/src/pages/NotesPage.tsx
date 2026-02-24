import { CrudResourcePage } from '../components/CrudResourcePage';
import { WebScreen } from '../components/ui/WebScreen';

export function NotesPage() {
  return (
    <WebScreen title="Notes">
      <CrudResourcePage
        title="Notes"
        resourcePath="/notes"
        createExample={{ title: 'Meeting notes', body: '...' }}
        showHeader={false}
      />
    </WebScreen>
  );
}
