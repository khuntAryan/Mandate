import { X, ExternalLink } from 'lucide-react';
import FlowDiagram from './FlowDiagram';

const LINKS = [
  { label: 'Razorpay AI Buildathon', url: 'https://razorpay.com/buildathon/', note: 'The brief this project was built against' },
  { label: 'Razorpay UPI Autopay docs', url: 'https://razorpay.com/docs/payments/payment-gateway/s2s-integration/recurring-payments/upi/', note: 'The real settlement rail behind the payment mandate' },
  { label: "Google's Agent Payments Protocol (AP2)", url: 'https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol', note: 'The signed-mandate concept this project borrows' },
  { label: 'Agentic Commerce Protocol (ACP)', url: 'https://www.openai.com/index/buy-it-in-chatgpt/', note: "OpenAI and Stripe's agent checkout standard" },
  { label: 'x402 (Coinbase)', url: 'https://www.coinbase.com/developer-platform/products/x402', note: 'Stablecoin settlement rail for agent payments' },
  { label: "NPCI's Unified Agent Protocol", url: 'https://www.business-standard.com/finance/news/india-may-allow-agentic-ai-led-upi-transactions-under-new-npci-protocol-126070801343_1.html', note: "India's own agent-payments framework, not yet live" }
];

export default function InfoPanel({ onClose }) {
  return (
    <div className="info-overlay" onClick={onClose}>
      <div className="info-panel" onClick={(e) => e.stopPropagation()}>
        <div className="info-header">
          <h2>About Mandate</h2>
          <button className="icon-button" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <section className="info-section">
          <p className="info-lede">
            An AI agent that can spend money on your behalf, without ever being able to go rogue with it.
          </p>
          <p>
            Right now there is no safe way to let an AI agent buy things for you. Every payment system
            assumes a human is physically clicking "buy" - so nobody can verify an agent's purchase was
            actually authorized, or stop it from overspending. Google, OpenAI, Stripe, and Coinbase have
            all shipped protocols to solve this in the last year. None of them settle over UPI, India's
            dominant payment rail, and NPCI's own agent framework hasn't launched yet either.
          </p>
        </section>

        <section className="info-section">
          <h3>How it works</h3>
          <FlowDiagram />
          <ol className="info-steps">
            <li>You set a spending rule once - a cap, a list of merchants, a category.</li>
            <li>That rule becomes a signed, tamper-evident intent mandate.</li>
            <li>An agent shops within that rule and locks in a price with a signed cart mandate.</li>
            <li>A single-use payment mandate triggers a real Razorpay UPI Autopay debit.</li>
            <li>Every step - approved or blocked - is written to an audit trail you can check anytime.</li>
          </ol>
        </section>

        <section className="info-section">
          <h3>What's real, honestly</h3>
          <p>
            Mandate signing, the policy engine, the price-mismatch safety check, and the audit trail are
            fully real and tested code. The Razorpay integration is implemented and verified against their
            documentation across three separate approaches. Full live execution is currently blocked by an
            account-level activation step on Razorpay's side, not a gap in the build - the app runs in a
            simulated mode that exercises the identical logic.
          </p>
        </section>

        <section className="info-section">
          <h3>References</h3>
          <ul className="info-links">
            {LINKS.map((link) => (
              <li key={link.url}>
                <a href={link.url} target="_blank" rel="noreferrer">
                  <ExternalLink size={13} />
                  <span>
                    <strong>{link.label}</strong>
                    <span className="info-link-note">{link.note}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
