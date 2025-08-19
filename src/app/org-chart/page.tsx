import { OrganizationalChart } from '@/components/organizational-chart';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Organizational Chart - MOBOFIS',
  description: 'Company organizational structure visualization using React Flow',
};

export default function OrganizationalChartPage() {
  return (
    <main className="w-full">
      <OrganizationalChart />
    </main>
  );
}
