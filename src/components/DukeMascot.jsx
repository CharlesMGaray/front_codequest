export default function DukeMascot({ className = '', style = {} }) {
  return (
    <div className={`duke-mascot ${className}`} style={style} aria-hidden="true">
      <svg
        viewBox="0 0 120 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="duke-svg"
      >
        <defs>
          <radialGradient id="dukeNoseGlow" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#ff6b6b" />
            <stop offset="60%" stopColor="#e11d48" />
            <stop offset="100%" stopColor="#9f1239" />
          </radialGradient>
          <filter id="dukeShadow" x="-10%" y="-10%" width="120%" height="130%">
            <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#000" floodOpacity="0.4" />
          </filter>
        </defs>

        <g filter="url(#dukeShadow)">
          {/* Main Body (Black Hooded Figure) */}
          <path
            d="M 52 14
               C 35 14, 20 38, 16 68
               C 12 94, 18 122, 28 126
               C 34 128, 42 120, 48 116
               C 56 122, 66 124, 76 116
               C 80 120, 86 126, 92 124
               C 98 118, 98 94, 94 68
               C 90 38, 75 14, 52 14 Z"
            fill="#09090b"
            stroke="#18181b"
            strokeWidth="3"
            strokeLinejoin="round"
          />

          {/* Left Resting Arm */}
          <path
            d="M 17 72 C 10 78, 8 92, 14 100 C 18 102, 20 96, 20 90"
            fill="#09090b"
            stroke="#18181b"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* White Belly Patch */}
          <path
            d="M 50 56
               C 36 60, 28 78, 30 102
               C 32 114, 45 118, 54 114
               C 62 118, 74 116, 78 104
               C 82 82, 74 62, 58 56
               C 55 55, 52 55, 50 56 Z"
            fill="#ffffff"
            stroke="#09090b"
            strokeWidth="2"
          />

          {/* Waving Right Arm and Hand */}
          <g className="duke-waving-arm">
            {/* Upper Arm */}
            <path
              d="M 88 64
                 C 96 56, 104 46, 108 34"
              stroke="#09090b"
              strokeWidth="9"
              strokeLinecap="round"
            />
            {/* Waving Hand & Fingers */}
            <path
              d="M 107 33
                 C 107 26, 114 26, 115 31
                 C 117 24, 124 25, 123 32
                 C 126 27, 131 29, 128 36
                 C 131 34, 133 39, 127 43
                 C 121 48, 113 46, 107 38 Z"
              fill="#09090b"
              stroke="#09090b"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </g>

          {/* Red Big Nose */}
          <ellipse
            cx="52"
            cy="52"
            rx="13"
            ry="11"
            fill="url(#dukeNoseGlow)"
            stroke="#881337"
            strokeWidth="1.5"
          />

          {/* Nose Highlight */}
          <ellipse
            cx="48"
            cy="48"
            rx="4"
            ry="2.5"
            fill="#ffffff"
            opacity="0.65"
            transform="rotate(-20 48 48)"
          />
        </g>
      </svg>
    </div>
  )
}

