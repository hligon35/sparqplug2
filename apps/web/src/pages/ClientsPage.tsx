import { CrudResourcePage } from '../components/CrudResourcePage';

export function ClientsPage() {
  return (
    <CrudResourcePage
      title="Clients"
      resourcePath="/clients"
      createExample={{ name: 'Acme Co', email: 'client@example.com' }}
    />
  );
}
