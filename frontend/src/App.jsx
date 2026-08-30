import { useEffect, useState } from 'react';
import { Info } from 'lucide-react';
import { api } from './api';
import { ToastProvider } from './components/Toast';
import PolicySetup from './components/PolicySetup';
import AgentChat from './components/AgentChat';
import AuditLog from './components/AuditLog';
import StatsBar from './components/StatsBar';
import Logo from './components/Logo';
import InfoPanel from './components/InfoPanel';
import FlowDiagram from './components/FlowDiagram';
import { AnnotationAbove } from './components/Annotation';

const SECTIONS = [
  { id: 'setup', number: '01', label: 'Setup' },
  { id: 'agent', number: '02', label: 'Agent' },
  { id: 'ledger', number: '03', label: 'Ledger' }
];

export default function App() {
  const [policy, setPolicy] = useState(null);
  const [audit, setAudit] = useState([]);
  const [health, setHealth] = useState(null);
  const [section, setSection] = useState('setup');
  const [infoOpen, setInfoOpen] = useState(false);
  const [annotate, setAnnotate] = useState(false);

  const refreshAudit = async () => {
    const log = await api.getAudit();
    setAudit(log);
  };

  useEffect(() => {
    api.getPolicy().then(setPolicy);
    api.getHealth().then(setHealth).catch(() => setHealth(null));
    refreshAudit();
    const auditInterval = setInterval(refreshAudit, 2000);
    const policyInterval = setInterval(() => {
      api.getPolicy().then(setPolicy).catch(() => {});
    }, 2000);
    const healthInterval = setInterval(() => {
      api.getHealth().then(setHealth).catch(() => setHealth(null));
    }, 5000);
    return () => {
      clearInterval(auditInterval);
      clearInterval(policyInterval);
      clearInterval(healthInterval);
    };
  }, []);

  return (
    <ToastProvider>
      <div className={annotate ? 'app annotate-active' : 'app'}>
        <header className="topbar">
          <div className="brand">
            <Logo />
            <span className="brand-name">Mandate</span>
          </div>
          <div className="topbar-right">
            {health && (
              <span className="status-pill">
                <span className={health.razorpayMock ? 'status-dot status-dot-mock' : 'status-dot'}></span>
                {health.razorpayMock ? 'Simulated mode' : 'Live test mode'}
              </span>
            )}
            <button
              className={annotate ? 'annotate-toggle annotate-toggle-on' : 'annotate-toggle'}
              onClick={() => setAnnotate((a) => !a)}
            >
              <span className="annotate-toggle-track">
                <span className="annotate-toggle-thumb"></span>
              </span>
              Annotate
            </button>
            <button className="icon-button" onClick={() => setInfoOpen(true)} aria-label="About Mandate">
              <Info size={18} />
            </button>
          </div>
        </header>

        {infoOpen && <InfoPanel onClose={() => setInfoOpen(false)} />}

        <p className="tagline">Let an agent shop for you, without ever losing the paper trail.</p>

        <StatsBar policy={policy} audit={audit} annotate={annotate} />

        <nav className="section-nav">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              className={section === s.id ? 'section-tab section-tab-active' : 'section-tab'}
              onClick={() => setSection(s.id)}
            >
              <span className="section-num">{s.number}</span>
              {s.label}
              {annotate && s.id === 'agent' && (
                <AnnotationAbove text="Agent finds the product to buy." style={{ left: '20%' }} />
              )}
              {annotate && s.id === 'ledger' && (
                <AnnotationAbove text="Every log kept here." style={{ left: '20%' }} />
              )}
            </button>
          ))}
        </nav>

        <main className="panel">
          {section === 'setup' && (
            <PolicySetup policy={policy} onPolicyChange={setPolicy} onAudit={refreshAudit} annotate={annotate} />
          )}
          {section === 'agent' && <AgentChat policy={policy} onAudit={refreshAudit} annotate={annotate} />}
          {section === 'ledger' && <AuditLog entries={audit} annotate={annotate} />}
        </main>

        <section className="flow-section">
          <h2>How it works</h2>
          <FlowDiagram />
          <div className="flow-captions">
            <div className="flow-caption">
              <span className="flow-caption-num">01</span>
              <p>Set once. The cap and merchant list lock before anything else can happen.</p>
            </div>
            <div className="flow-caption">
              <span className="flow-caption-num">02</span>
              <p>Signed, not promised. The price is cryptographically locked before a rupee moves.</p>
            </div>
            <div className="flow-caption">
              <span className="flow-caption-num">03</span>
              <p>Nothing hidden. Every attempt - approved or blocked - lands in the ledger.</p>
            </div>
          </div>
        </section>
      </div>
    </ToastProvider>
  );
}

