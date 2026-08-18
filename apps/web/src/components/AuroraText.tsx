import React from 'react';

interface AuroraTextProps {
  text: string;
  font?: {
    fontFamily?: string;
    fontWeight?: number | string;
    fontSize?: string;
    lineHeight?: string;
    letterSpacing?: string;
    textAlign?: 'left' | 'center' | 'right' | 'justify' | 'inherit' | 'initial';
  };
  colors?: string[];
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  speed?: number; // in seconds
  angle?: number; // in degrees
}

export function AuroraText({
  text,
  font = {},
  colors = ['#A6B7A8', '#1EB73A'],
  direction = 'alternate',
  speed = 5,
  angle = 135,
}: AuroraTextProps) {
  const gradient = `linear-gradient(${angle}deg, ${colors.join(', ')}, ${colors[0]})`;

  return (
    <>
      <span
        className="aurora-text"
        style={{
          ...font,
          backgroundImage: gradient,
          backgroundSize: '200% auto',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          color: 'transparent',
          display: 'inline-block',
          animation: `aurora-anim ${speed}s linear infinite ${direction}`,
        }}
      >
        {text}
      </span>
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes aurora-anim {
            0% { background-position: 0% center; }
            100% { background-position: 200% center; }
          }
        `
      }} />
    </>
  );
}
