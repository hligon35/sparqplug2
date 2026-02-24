import { CrudResourcePage } from '../components/CrudResourcePage';

export function FilesPage() {
  return (
    <CrudResourcePage
      title="Files"
      resourcePath="/files"
      createExample={{ name: 'example.pdf', contentType: 'application/pdf' }}
    />
  );
}
