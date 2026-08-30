import { ShieldCheck, ShieldAlert, ShieldOff, Wallet, CheckCircle2, XCircle } from 'lucide-react';
import { AnnotationAbove } from './Annotation';

export default function StatsBar({ policy, audit, annotate }) {
  const completed = audit.filter((e) => e.event === 'debit_executed').length;
  const blocked = audit.filter((e) => e.event === 'purchase_blocked').length;
  const spent = policy?.spent || 0;
  const cap = policy?.capAmount || 0;
  const pct = cap ? Math.min(100, Math.round((spent / cap) * 100)) : 0;

  let statusLabel = 'No mandate';
  let StatusIcon = ShieldOff;
  if (policy?.status === 'active') {
    statusLabel = 'Active';
    StatusIcon = ShieldCheck;
  } else if (policy?.status === 'awaiting_approval') {
    statusLabel = 'Awaiting approval';
    StatusIcon = ShieldAlert;
  }

  return (
    <div className="stats-strip">
      <div className="stat-cell">
        <div className="stat-top">
          <StatusIcon size={14} />
          <span className="stat-label">Mandate</span>
        </div>
        <p className="stat-value">{statusLabel}</p>
      </div>

      <div className="stat-cell">
        <div className="stat-top">
          <Wallet size={14} />
          <span className="stat-label">Spent this cycle</span>
        </div>
        <p className="stat-value">
          Rs {spent} {cap ? `/ ${cap}` : ''}
        </p>
        {cap > 0 && (
          <div className="stat-progress">
            <div className="stat-progress-fill" style={{ width: pct + '%' }} />
          </div>
        )}
        {annotate && <AnnotationAbove text="Checked against the hard cap." style={{ left: '10%' }} />}
      </div>

      <div className="stat-cell">
        <div className="stat-top">
          <CheckCircle2 size={14} />
          <span className="stat-label">Completed</span>
        </div>
        <p className="stat-value">{completed}</p>
      </div>

      <div className="stat-cell">
        <div className="stat-top">
          <XCircle size={14} />
          <span className="stat-label">Blocked</span>
        </div>
        <p className="stat-value">{blocked}</p>
        {annotate && <AnnotationAbove text="Blocked transactions, counted here." style={{ left: '10%' }} />}
      </div>
    </div>
  );
}
