import { CrudResourcePage } from '../components/CrudResourcePage';
import { WebScreen } from '../components/ui/WebScreen';

export function FilesPage() {
  return (
    <WebScreen title="Files">
      <CrudResourcePage
        title="Files"
        resourcePath="/files"
        createExample={{ name: 'example.pdf', contentType: 'application/pdf' }}
        showHeader={false}
      />
    </WebScreen>
  );
}
