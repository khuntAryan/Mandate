function Node({ x, y, w, h, title, sub }) {
  const r = h / 2;
  return (
    <g fontFamily="Inter" fontWeight="700">
      <rect x={x} y={y} width={w} height={h} rx={r} fill="#ffffff" stroke="#111111" strokeWidth="2" />
      <text x={x + w / 2} y={y + h / 2 - 7} textAnchor="middle" fontSize="12.5" fill="#111111">
        {title}
      </text>
      <text
        x={x + w / 2}
        y={y + h / 2 + 12}
        textAnchor="middle"
        fontSize="10"
        fontWeight="400"
        fill="#6b6b6b"
        fontFamily="JetBrains Mono"
      >
        {sub}
      </text>
    </g>
  );
}

const ROW_Y = 115;
const ROW_H = 58;
const CENTER_Y = ROW_Y + ROW_H / 2;

export default function FlowDiagram() {
  return (
    <svg viewBox="0 0 830 210" className="flow-diagram" role="img">
      <title>Mandate system flow</title>
      <desc>
        A rule is set once, the agent finds an item within it, mandates
        lock in the price and authorization, UPI Autopay executes the
        debit, and every step lands in the audit trail - with a blocked
        path when something does not check out.
      </desc>

      <defs>
        <marker id="flowArrow" markerWidth="9" markerHeight="9" refX="6" refY="4.5" orient="auto">
          <path d="M0 0L8 4.5L0 9Z" fill="#9a9a9a" />
        </marker>
        <marker id="flowArrowRed" markerWidth="9" markerHeight="9" refX="6" refY="4.5" orient="auto">
          <path d="M0 0L8 4.5L0 9Z" fill="#e10600" />
        </marker>
      </defs>

      <path d={`M140 ${CENTER_Y} Q157 ${CENTER_Y - 6} 175 ${CENTER_Y}`} fill="none" stroke="#9a9a9a" strokeWidth="2.5" markerEnd="url(#flowArrow)" />
      <path d={`M305 ${CENTER_Y} Q322 ${CENTER_Y - 6} 340 ${CENTER_Y}`} fill="none" stroke="#9a9a9a" strokeWidth="2.5" markerEnd="url(#flowArrow)" />
      <path d={`M482 ${CENTER_Y} Q499 ${CENTER_Y - 6} 517 ${CENTER_Y}`} fill="none" stroke="#9a9a9a" strokeWidth="2.5" markerEnd="url(#flowArrow)" />
      <path d={`M641 ${CENTER_Y} Q658 ${CENTER_Y - 6} 676 ${CENTER_Y}`} fill="none" stroke="#9a9a9a" strokeWidth="2.5" markerEnd="url(#flowArrow)" />

      <path d={`M411 ${ROW_Y} Q422 ${ROW_Y - 10} 411 ${ROW_Y - 20}`} fill="none" stroke="#e10600" strokeWidth="2.5" markerEnd="url(#flowArrowRed)" />

      <Node x={10} y={ROW_Y} w={130} h={ROW_H} title="USER SETS RULE" sub="cap + merchants" />
      <Node x={175} y={ROW_Y} w={130} h={ROW_H} title="AGENT FINDS ITEM" sub="scored, ranked" />
      <Node x={340} y={ROW_Y} w={142} h={ROW_H} title="SIGNED MANDATES" sub="intent + cart + pay" />
      <Node x={517} y={ROW_Y} w={124} h={ROW_H} title="UPI AUTOPAY" sub="real debit" />
      <Node x={676} y={ROW_Y} w={144} h={ROW_H} title="AUDIT TRAIL" sub="every step logged" />

      <g fontFamily="Inter" fontWeight="800">
        <circle cx="411" cy="50" r="42" fill="none" stroke="#e10600" strokeWidth="2.5" />
        <circle cx="411" cy="50" r="46" fill="none" stroke="#e10600" strokeWidth="1" opacity="0.5" />
        <text x="411" y="55" textAnchor="middle" fontSize="14" fill="#e10600">
          BLOCKED
        </text>
      </g>
    </svg>
  );
}
