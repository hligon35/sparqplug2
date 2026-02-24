import { CrudResourcePage } from '../components/CrudResourcePage';
import { WebScreen } from '../components/ui/WebScreen';

export function ClientsPage() {
  return (
    <WebScreen title="Clients">
      <CrudResourcePage
        title="Clients"
        resourcePath="/clients"
        createExample={{ name: 'Acme Co', email: 'client@example.com' }}
        showHeader={false}
      />
    </WebScreen>
  );
}
