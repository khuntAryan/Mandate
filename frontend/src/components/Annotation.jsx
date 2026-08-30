export function Annotation({ text, style, arrowDown = false }) {
  const path = arrowDown ? 'M34 4 Q10 8 4 30 L10 23 M4 30 L12 31' : 'M34 30 Q10 26 4 4 L10 11 M4 4 L12 3';
  return (
    <div className="annotation annotation-side" style={style}>
      <svg className="annotation-connector" width="40" height="34" viewBox="0 0 40 34">
        <path d={path} fill="none" stroke="#bb0400" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <p className="annotation-text">{text}</p>
    </div>
  );
}

export function AnnotationAbove({ text, style }) {
  return (
    <div className="annotation-above-wrap" style={style}>
      <p className="annotation-text">{text}</p>
      <svg className="annotation-connector" width="34" height="30" viewBox="0 0 34 30">
        <path d="M4 2 Q8 16 26 24 L19 21 M26 24 L21 15" fill="none" stroke="#bb0400" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export function AnnotationCircle({ text, style, labelSide = 'right' }) {
  return (
    <div className="annotation-circle-wrap" style={style}>
      <svg className="annotation-circle-svg" viewBox="0 0 140 56" preserveAspectRatio="none">
        <ellipse cx="70" cy="28" rx="66" ry="24" fill="none" stroke="#bb0400" strokeWidth="1.8" transform="rotate(-2 70 28)" />
      </svg>
      <span className={`annotation-circle-label annotation-circle-label-${labelSide}`}>{text}</span>
    </div>
  );
}

export function AnnotationLine({ text, style, width = 90 }) {
  return (
    <div className="annotation-line-wrap" style={style}>
      <svg className="annotation-line-svg" width={width} height="14" viewBox={`0 0 ${width} 14`}>
        <path d={`M2 7 Q ${width / 2} 2 ${width - 4} 7`} fill="none" stroke="#bb0400" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <span className="annotation-line-text">{text}</span>
    </div>
  );
}

export function AnnotationBracket({ text, height = 140, style }) {
  const mid = height / 2;
  const path = `M4 4 Q16 4 16 ${mid - 14} Q16 ${mid} 26 ${mid} Q16 ${mid} 16 ${mid + 14} Q16 ${height - 4} 4 ${height - 4}`;
  return (
    <div className="annotation-bracket-wrap" style={{ height, ...style }}>
      <svg className="annotation-bracket-svg" width="30" height={height} viewBox={`0 0 30 ${height}`}>
        <path d={path} fill="none" stroke="#bb0400" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <p className="annotation-bracket-text">{text}</p>
    </div>
  );
}

export default Annotation;
