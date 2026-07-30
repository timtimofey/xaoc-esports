import { useState } from 'react';

export default function GlitchText({ text = '', className = '' }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <span
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative inline-block cursor-default font-bold ${className}`}
    >
      <span className={isHovered ? 'opacity-0' : 'opacity-100'}>{text}</span>
      {isHovered && (
        <>
          <span className="absolute left-0 top-0 text-cyan-400 translate-x-[1px] translate-y-[-1px] opacity-90 clip-path-top animate-pulse">
            {text}
          </span>
          <span className="absolute left-0 top-0 text-amber-500 translate-x-[-1px] translate-y-[1px] opacity-90 clip-path-bottom">
            {text}
          </span>
          <span className="relative z-10 text-white">{text}</span>
        </>
      )}
    </span>
  );
}
