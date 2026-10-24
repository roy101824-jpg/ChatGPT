export function TrailArt({ small = false }: { small?: boolean }) {
  return (
    <svg
      className={small ? "trail-art small" : "trail-art"}
      viewBox="0 0 420 290"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="220" cy="133" r="117" fill="#e3ebd1" />
      <circle cx="330" cy="70" r="23" fill="#f3cd65" />
      <path
        d="M31 257C60 183 127 180 170 218C205 169 283 173 303 225C341 202 383 226 402 257H31Z"
        fill="#b4cda3"
      />
      <path
        d="M65 257L174 81C183 65 198 62 210 80L320 257H65Z"
        fill="#7fa98c"
      />
      <path
        d="M184 65L143 133L176 122L194 138L211 123L239 138L210 80C204 70 192 63 184 65Z"
        fill="#f8f8e8"
      />
      <path
        d="M205 257C245 234 243 213 211 201C166 185 163 168 198 146"
        stroke="#f4e6bd"
        strokeWidth="19"
        strokeLinecap="round"
      />
      <path
        d="M205 257C245 234 243 213 211 201C166 185 163 168 198 146"
        stroke="#d8bd80"
        strokeWidth="2"
        strokeDasharray="3 10"
        strokeLinecap="round"
      />
      <path
        d="M194 70V31"
        stroke="#375d45"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path d="M196 30L231 39L196 49V30Z" fill="#e68360" />
      <path
        d="M72 240V200M349 249V211"
        stroke="#537d5c"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M72 217C49 217 43 202 48 191C67 191 76 202 72 217ZM74 208C71 191 84 179 96 182C100 196 87 208 74 208Z"
        fill="#62886a"
      />
      <path
        d="M350 226C330 227 323 214 329 204C343 203 352 213 350 226ZM351 219C350 204 361 193 372 198C373 211 365 219 351 219Z"
        fill="#62886a"
      />
      <g transform="translate(267 123) rotate(10)">
        <rect
          width="75"
          height="86"
          rx="14"
          fill="#fffdf3"
          stroke="#e0e4d3"
          strokeWidth="2"
        />
        <text
          x="37"
          y="45"
          fontFamily="Georgia,serif"
          fontSize="30"
          fill="#215e4c"
          textAnchor="middle"
        >
          Aa
        </text>
        <path
          d="M22 61H53M28 68H47"
          stroke="#b7c7ac"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </g>
      <g transform="translate(62 92) rotate(-12)">
        <rect width="55" height="59" rx="13" fill="#fffdf3" />
        <path
          d="M16 30L25 39L41 20"
          stroke="#4b8760"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <path
        d="M110 52V64M104 58H116M309 26V36M304 31H314"
        stroke="#98af7f"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="292" cy="89" r="4" fill="#e7a16d" />
      <circle cx="130" cy="169" r="3" fill="#f3cd65" />
    </svg>
  );
}
