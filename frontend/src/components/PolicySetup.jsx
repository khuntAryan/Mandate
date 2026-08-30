import { useEffect, useState } from 'react';
import { Loader2, ShieldCheck, Clock3, ExternalLink, RefreshCw } from 'lucide-react';
import { api } from '../api';
import { useToast } from './Toast';
import Annotation, { AnnotationBracket } from './Annotation';

export default function PolicySetup({ policy, onPolicyChange, onAudit, annotate }) {
  const toast = useToast();
  const [merchants, setMerchants] = useState([]);
  const [cap, setCap] = useState(3000);
  const [selected, setSelected] = useState([]);
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    api.getMerchants().then((res) => {
      setMerchants(res.merchants || []);
      setSelected(res.merchants ? res.merchants.slice(0, 1) : []);
    });
  }, []);

  const toggle = (m) => {
    setSelected((s) => (s.includes(m) ? s.filter((x) => x !== m) : [...s, m]));
  };

  const save = async () => {
    if (!selected.length) {
      toast.error('Pick at least one merchant first.');
      return;
    }
    setSaving(true);
    try {
      const result = await api.setPolicy({
        capAmount: cap,
        merchants: selected,
        category: 'gifts',
        expiryDays: 30,
        name: name || undefined,
        contact: contact || undefined,
        email: email || undefined
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        onPolicyChange(result);
        toast.success(
          result.status === 'active' ? 'Mandate registered and active.' : 'Mandate created - approval needed.'
        );
      }
      onAudit();
    } catch (err) {
      toast.error('Could not reach the backend. Is it running?');
    } finally {
      setSaving(false);
    }
  };

  const checkApproval = async () => {
    setChecking(true);
    try {
      const result = await api.checkApproval();
      if (result.error) {
        toast.error(result.error);
      } else {
        onPolicyChange(result);
        if (result.status === 'active') {
          toast.success('Mandate approved and active.');
        } else {
          toast.info('Still waiting on approval.');
        }
      }
      onAudit();
    } catch (err) {
      toast.error('Could not reach the backend. Is it running?');
    } finally {
      setChecking(false);
    }
  };

  return (
    <section className="card">
      <div className="card-title-row">
        <h2>Set the rule, once</h2>
        {policy?.status === 'active' && (
          <span className="badge badge-ok">
            <ShieldCheck size={13} /> Active
          </span>
        )}
        {policy?.status === 'awaiting_approval' && (
          <span className="badge badge-pending">
            <Clock3 size={13} /> Pending
          </span>
        )}
      </div>

      <label className="field">
        <span>Monthly cap (Rs)</span>
        <input type="number" min="0" step="50" value={cap} onChange={(e) => setCap(Number(e.target.value))} />
        {annotate && <Annotation text="Locked once - nothing above this cap can move." />}
      </label>

      <div className="field">
        <span>Allowed merchants ({merchants.length} available - drop a new merchant file in to add more)</span>
        <div className="chips">
          {merchants.map((m) => (
            <button
              key={m}
              type="button"
              className={selected.includes(m) ? 'chip chip-on' : 'chip'}
              onClick={() => toggle(m)}
            >
              {m}
            </button>
          ))}
        </div>
        {annotate && <Annotation text="Every purchase is checked against this list first." />}
      </div>

      <div style={{ position: 'relative' }}>
        <label className="field">
          <span>Your name</span>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
        </label>
        <label className="field">
          <span>Your phone number (for real UPI approval, optional in mock mode)</span>
          <input type="text" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="9876543210" />
        </label>
        <label className="field">
          <span>Your email (for real UPI approval, optional in mock mode)</span>
          <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </label>
        {annotate && <AnnotationBracket text="This is what's needed to set up real Autopay." height={200} />}
      </div>

      <button className="primary" onClick={save} disabled={saving || !selected.length}>
        {saving ? (
          <>
            <Loader2 size={14} className="spin" /> Registering
          </>
        ) : policy ? (
          'Update mandate'
        ) : (
          'Register mandate'
        )}
      </button>

      {policy && policy.status === 'awaiting_approval' && policy.shortUrl && (
        <div className="pick">
          <p className="hint">Open this link and approve with your UPI app:</p>
          <a className="mono approval-link" href={policy.shortUrl} target="_blank" rel="noreferrer">
            <ExternalLink size={13} /> {policy.shortUrl}
          </a>
          <button className="secondary" onClick={checkApproval} disabled={checking} style={{ marginTop: 10 }}>
            {checking ? (
              <>
                <Loader2 size={14} className="spin" /> Checking
              </>
            ) : (
              <>
                <RefreshCw size={14} /> I've approved it - check status
              </>
            )}
          </button>
        </div>
      )}

      {policy && policy.status === 'active' && (
        <p className="hint mono">
          token {policy.tokenId} · spent Rs {policy.spent} of {policy.capAmount}
        </p>
      )}
    </section>
  );
}
