import { useState } from 'react';
import { Loader2, Search, ShoppingBag, Sparkles } from 'lucide-react';
import { api } from '../api';
import { useToast } from './Toast';
import Annotation, { AnnotationLine, AnnotationCircle } from './Annotation';

export default function AgentChat({ policy, onAudit, annotate }) {
  const toast = useToast();
  const [message, setMessage] = useState('Get something nice for Priya, under 2000, from Nykaa');
  const [pick, setPick] = useState(null);
  const [reasoning, setReasoning] = useState(null);
  const [alternatives, setAlternatives] = useState([]);
  const [result, setResult] = useState(null);
  const [drift, setDrift] = useState(false);
  const [searching, setSearching] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const ask = async () => {
    setResult(null);
    setPick(null);
    setAlternatives([]);
    setSearching(true);
    try {
      const res = await api.agentRequest(message);
      if (res.found) {
        setPick(res.product);
        setReasoning(res.reasoning);
        setAlternatives(res.alternatives || []);
        toast.info(`Found ${res.product.name} for Rs ${res.product.price}.`);
      } else {
        toast.error(res.message || 'No matching product found.');
      }
      onAudit();
    } catch (err) {
      toast.error('Could not reach the backend. Is it running?');
    } finally {
      setSearching(false);
    }
  };

  const confirm = async (product) => {
    setConfirming(true);
    try {
      const res = await api.confirmPurchase({ productId: product.id, simulateDrift: drift });
      setResult(res);
      if (res.status === 'blocked') {
        toast.error(res.reason);
      } else if (res.status === 'scheduled') {
        toast.success(`Rs ${res.amount} scheduled to ${res.merchant}.`);
      } else {
        toast.error(res.reason || 'Purchase failed.');
      }
      onAudit();
    } catch (err) {
      toast.error('Could not reach the backend. Is it running?');
    } finally {
      setConfirming(false);
    }
  };

  const ready = policy && policy.status === 'active';

  return (
    <section className="card">
      <h2>Ask the agent</h2>
      {!ready && (
        <p className="hint">
          {policy && policy.status === 'awaiting_approval'
            ? 'Waiting for you to approve the mandate, on the left.'
            : 'Register a mandate first, on the left.'}
        </p>
      )}
      <textarea rows="2" value={message} onChange={(e) => setMessage(e.target.value)} />
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <button className="secondary" onClick={ask} disabled={!ready || searching}>
          {searching ? (
            <>
              <Loader2 size={14} className="spin" /> Searching
            </>
          ) : (
            <>
              <Search size={14} /> Find a match
            </>
          )}
        </button>
        {annotate && <AnnotationLine text="Finds a product within the cap." width={100} />}
      </div>

      {pick && (
        <div className="pick">
          <p>
            <strong>{pick.name}</strong> · {pick.merchant} · Rs {pick.price}
          </p>
          {reasoning && (
            <p className="agent-reasoning">
              <Sparkles size={12} /> {reasoning}
            </p>
          )}
          <label className="drift-toggle">
            <input type="checkbox" checked={drift} onChange={(e) => setDrift(e.target.checked)} />
            Simulate a price change before payment
          </label>
          <button className="primary" onClick={() => confirm(pick)} disabled={confirming}>
            {confirming ? (
              <>
                <Loader2 size={14} className="spin" /> Confirming
              </>
            ) : (
              <>
                <ShoppingBag size={14} /> Confirm purchase
              </>
            )}
          </button>

          {alternatives.length > 0 && (
            <div className="alternatives">
              <p className="hint" style={{ margin: '12px 0 6px' }}>
                Other options the agent considered:
              </p>
              {alternatives.map((alt, i) => (
                <button key={alt.id} className="alt-row" onClick={() => confirm(alt)} disabled={confirming}>
                  <span>{alt.name}</span>
                  <span className="mono" style={{ position: 'relative' }}>
                    Rs {alt.price}
                    {annotate && i === 0 && (
                      <AnnotationCircle text="other options" style={{ top: -18, left: -20, width: 90, height: 36 }} />
                    )}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {result && (
        <div className={result.status === 'blocked' ? 'result result-blocked' : 'result result-ok'}>
          {result.status === 'blocked' ? (
            <p>Blocked: {result.reason}</p>
          ) : (
            <p>
              Scheduled Rs {result.amount} to {result.merchant}. {result.note}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
