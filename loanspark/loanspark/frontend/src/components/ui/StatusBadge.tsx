import { LoanStatus } from '@/types';

const MAP: Record<LoanStatus, string> = {
  applied:    'badge-applied',
  sanctioned: 'badge-sanctioned',
  disbursed:  'badge-disbursed',
  closed:     'badge-closed',
  rejected:   'badge-rejected',
};

export default function StatusBadge({ status }: { status: LoanStatus }) {
  return <span className={MAP[status] || 'badge'}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
}
