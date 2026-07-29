import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  variant?: 'dark' | 'light';
  showText?: boolean;
  simplified?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ 
  className = '', 
  size = 'md', 
  variant = 'light', // default to light theme (black elements on white bg)
  showText = true,
  simplified = false
}) => {
  // Variant 'dark' is white elements (usually for black/dark backgrounds)
  // Variant 'light' is black elements (usually for white backgrounds)
  const color = variant === 'dark' ? '#ffffff' : '#0d0d0d';

  // Determine width/height in px
  let width = 120;
  let height = 120;
  if (size === 'sm') { width = 48; height = 48; }
  else if (size === 'md') { width = 120; height = 120; }
  else if (size === 'lg') { width = 200; height = 200; }
  else if (size === 'xl') { width = 320; height = 320; }
  else if (typeof size === 'number') { width = size; height = size; }

  if (simplified) {
    // Circle + R or RP for mini app-icon feel
    return (
      <svg 
        width={width} 
        height={height} 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <circle cx="50" cy="50" r="42" stroke={color} strokeWidth="6" />
        <text
          x="48"
          y="58"
          textAnchor="middle"
          fill={color}
          style={{
            fontFamily: '"Space Grotesk", "Outfit", "Inter", "sans-serif"',
            fontWeight: 900,
            fontSize: '32px',
            fontStyle: 'italic',
            letterSpacing: '-1px'
          }}
        >
          RP
        </text>
      </svg>
    );
  }

  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 500 500" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ aspectRatio: '1/1' }}
    >
      {/* Top Arc of Circle */}
      {/* Starting from X=125 Y=200 to X=375 Y=200, center 250,250, radius 135 */}
      <path 
        d="M 125,200 A 135,135 0 0,1 375,200" 
        stroke={color} 
        strokeWidth="16" 
        strokeLinecap="round"
      />
      
      {/* Bottom Arc of Circle */}
      {/* Starting from X=375 Y=300 to X=125 Y=300, center 250,250, radius 135 */}
      <path 
        d="M 375,300 A 135,135 0 0,1 125,300" 
        stroke={color} 
        strokeWidth="16" 
        strokeLinecap="round"
      />

      {/* Styled text REPPULSE centered in the gap */}
      {showText && (
        <g transform="translate(250, 268)">
          <text
            x="0"
            y="0"
            textAnchor="middle"
            fill={color}
            style={{
              fontFamily: '"Space Grotesk", "Outfit", "Inter", sans-serif',
              fontWeight: 950,
              fontSize: '54px',
              letterSpacing: '1.5px',
              fontStyle: 'italic',
              textTransform: 'uppercase'
            }}
          >
            REPPULSE
          </text>
        </g>
      )}
    </svg>
  );
};
