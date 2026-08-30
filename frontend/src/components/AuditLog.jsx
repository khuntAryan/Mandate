import {
  FileSignature,
  Link2,
  Search,
  ShoppingCart,
  Ban,
  Wallet,
  Bell,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import Annotation, { AnnotationCircle } from './Annotation';

const META = {
  intent_mandate_created: { label: 'Intent mandate signed', icon: FileSignature, tone: 'neutral' },
  upi_autopay_registration_started: { label: 'UPI Autopay registration started', icon: Link2, tone: 'neutral' },
  upi_autopay_approval_pending: { label: 'Still waiting on approval', icon: Clock, tone: 'neutral' },
  upi_autopay_registered: { label: 'UPI Autopay token issued', icon: CheckCircle2, tone: 'ok' },
  upi_autopay_registration_failed: { label: 'UPI Autopay registration failed', icon: XCircle, tone: 'fail' },
  upi_autopay_checkout_completed_no_token_yet: { label: 'Checkout completed, awaiting token', icon: Clock, tone: 'neutral' },
  buyer_agent_search: { label: 'Agent searched the catalog', icon: Search, tone: 'neutral' },
  cart_mandate_created: { label: 'Cart mandate signed', icon: ShoppingCart, tone: 'neutral' },
  purchase_blocked: { label: 'Purchase blocked', icon: Ban, tone: 'fail' },
  purchase_error: { label: 'Purchase failed', icon: AlertTriangle, tone: 'fail' },
  payment_mandate_created: { label: 'Payment mandate signed', icon: FileSignature, tone: 'neutral' },
  pre_debit_notice_sent: { label: 'Pre-debit notice sent', icon: Bell, tone: 'neutral' },
  debit_executed: { label: 'Payment executed', icon: Wallet, tone: 'ok' },
  debit_finalize_failed: { label: 'Payment finalization failed', icon: XCircle, tone: 'fail' }
};

function detailFor(entry) {
  const d = entry.data || {};
  if (d.error) return d.error;
  if (d.reason) return d.reason;
  if (entry.event === 'debit_executed') return `Rs ${d.amount} to ${d.merchant}`;
  return null;
}

export default function AuditLog({ entries, annotate }) {
  const reversed = entries.slice().reverse();
  const firstFailIndex = reversed.findIndex((e) => (META[e.event] || {}).tone === 'fail');

  return (
    <section className="card audit">
      <h2 style={{ position: 'relative', display: 'inline-block' }}>
        Audit ledger
        {annotate && (
          <AnnotationCircle text="Every attempt - retried or failed - logged here." style={{ top: -10, left: -14, width: 150, height: 40 }} labelSide="right" />
        )}
      </h2>
      {entries.length === 0 && <p className="hint">Nothing logged yet.</p>}
      <ol className="ledger">
        {reversed.map((e, i) => {
          const meta = META[e.event] || { label: e.event, icon: FileSignature, tone: 'neutral' };
          const Icon = meta.icon;
          const detail = detailFor(e);
          return (
            <li key={i} className="ledger-row">
              <span className={`ledger-icon ledger-icon-${meta.tone}`}>
                <Icon size={14} />
              </span>
              <div style={{ position: 'relative', flex: 1 }}>
                <p className="ledger-label">{meta.label}</p>
                {detail && <p className={meta.tone === 'fail' ? 'ledger-detail' : 'ledger-detail-neutral'}>{detail}</p>}
                <p className="ledger-meta mono">{new Date(e.at).toLocaleTimeString()}</p>
                {annotate && i === firstFailIndex && (
                  <Annotation text="The one failure case - proves it's safe." />
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
