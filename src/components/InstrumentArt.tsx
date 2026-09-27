import type { InstrumentId } from '../lib/music';

/** Original vector artwork. Geometry and finishes are authored for Raagroom. */
export function InstrumentArt({ instrument, active }: { instrument: InstrumentId; active: boolean }) {
  if (instrument === 'violin') return <svg className={`violin-art ${active ? 'is-bowing' : ''}`} viewBox="0 0 900 360" aria-hidden="true">
    <defs>
      <linearGradient id="vwood" x1="0" x2="1"><stop stopColor="#5c2814" /><stop offset=".18" stopColor="#a25625" /><stop offset=".45" stopColor="#d79544" /><stop offset=".7" stopColor="#ad5823" /><stop offset="1" stopColor="#512311" /></linearGradient>
      <linearGradient id="vebony"><stop stopColor="#090b0c" /><stop offset=".5" stopColor="#32302a" /><stop offset="1" stopColor="#08090a" /></linearGradient>
      <filter id="vgrain"><feTurbulence type="fractalNoise" baseFrequency=".12 .004" numOctaves="2" seed="8" /><feColorMatrix type="saturate" values="0" /><feComponentTransfer><feFuncA type="linear" slope=".13" /></feComponentTransfer><feComposite in2="SourceAlpha" operator="in" result="grain" /><feBlend in="SourceGraphic" in2="grain" mode="multiply" /></filter>
      <filter id="vshadow" x="-40%" y="-30%" width="180%" height="180%"><feDropShadow dx="7" dy="18" stdDeviation="13" floodOpacity=".7" /></filter>
    </defs>
    <ellipse cx="369" cy="308" rx="220" ry="22" fill="#000" opacity=".25" />
    <g transform="translate(115, -6) rotate(-24 220 180)" filter="url(#vshadow)">
      <path d="M192 116C163 98 130 115 137 148C141 162 151 166 157 170C147 177 142 188 130 193C108 205 112 253 144 273C171 290 229 290 256 273C288 253 292 205 270 193C258 188 253 177 243 170C249 166 259 162 263 148C270 115 237 98 208 116Z" fill="url(#vwood)" stroke="#4c2719" strokeWidth="4" />
      <path d="M192 116C163 98 130 115 137 148C141 162 151 166 157 170C147 177 142 188 130 193C108 205 112 253 144 273C171 290 229 290 256 273C288 253 292 205 270 193C258 188 253 177 243 170C249 166 259 162 263 148C270 115 237 98 208 116Z" fill="url(#vwood)" filter="url(#vgrain)" stroke="#e7ad59" strokeWidth="1" />
      <path d="M185 118C158 106 139 120 144 147L165 170L137 200C117 220 128 253 149 266C177 280 223 280 251 266C272 253 283 220 263 200L235 170L256 147C261 120 242 106 215 118" stroke="#542b16" strokeWidth="1.5" fill="none" />
      <path d="M195 23h10l5 156h-20Z" fill="#b97837" stroke="#75441d" />
      <path d="M195 72h10l9 127h-28Z" fill="url(#vebony)" stroke="#111" />
      <path d="M193 38q-14-30 5-30q22 0 10 21q-6 10-14 6q-8-5 1-13q8-5 9 3" fill="none" stroke="#b57335" strokeWidth="7" />
      {[43, 58].map(y => <g key={y}><path d={`M181 ${y}h38`} stroke="#2c241d" strokeWidth="5" /><ellipse cx="179" cy={y} rx="7" ry="4" fill="#3e3024" /><ellipse cx="221" cy={y + 7} rx="7" ry="4" fill="#3e3024" /><path d={`M184 ${y + 7}h34`} stroke="#30271e" strokeWidth="4" /></g>)}
      <path d="M161 181c-12-7-14 7-7 13c5 4 4 12-3 18c-14 11-6 22 1 19m87-50c12-7 14 7 7 13c-5 4-4 12 3 18c14 11 6 22-1 19" stroke="#301d12" strokeWidth="3.5" fill="none" />
      <path d="M175 215Q200 203 225 215l-4 14h-6l-3-8h-24l-3 8h-6Z" fill="#e6c588" stroke="#92703e" strokeWidth="1" />
      <path d="M183 241h34l-11 37h-12Z" fill="url(#vebony)" stroke="#302a23" />
      <ellipse cx="161" cy="273" rx="29" ry="12" fill="#211b17" stroke="#392c20" />
      {[195, 198.4, 201.8, 205.2].map((x, i) => <path key={x} d={`M${x} 44L${x + (i - 1.5) * 2} 262`} stroke={i < 2 ? '#e0c89e' : '#ded8c7'} strokeWidth={1 - i * .12} opacity=".85" />)}
      <path d="M142 127q16-15 37-8" stroke="#f9d490" opacity=".3" fill="none" strokeWidth="3" />
    </g>
    <g className="bow"><path d="M530 69Q606 183 748 296" stroke="#61381f" strokeWidth="6" strokeLinecap="round" /><path d="M525 77L741 302" stroke="#d5c09b" strokeWidth="4" /><path d="M526 77L741 302" stroke="#fff0cf" strokeWidth=".6" /><path d="M719 277l22 25" stroke="#191c20" strokeWidth="13" /><path d="M721 278l18 22" stroke="#91816a" strokeWidth="3" /></g>
    <text x="630" y="100" fill="#756958" fontSize="10" letterSpacing="3">BOW. BREATHE. REPEAT.</text>
  </svg>;
  if (instrument !== 'guitar' && instrument !== 'bass') return null;
  const bass = instrument === 'bass';
  const body = bass ? 'M147 65C106 17 46 45 47 126C21 185 33 272 93 288C142 307 210 272 233 240C250 218 277 217 297 213C328 207 345 178 324 166L299 150C323 126 344 91 328 57C318 35 307 48 307 72C306 102 267 122 250 117C219 108 227 41 212 38C196 30 197 73 184 83Z' : 'M186 50C125 17 62 26 39 76C17 122 38 143 46 168C52 188 24 208 32 251C41 309 116 334 179 303C216 285 247 269 275 277C333 295 371 271 371 226C371 199 354 191 354 173C354 155 371 147 371 117C371 74 332 54 286 65C247 75 218 68 186 50Z';
  return <svg className="string-art" viewBox="0 0 900 340" aria-hidden="true">
    <defs>
      <linearGradient id={`${instrument}Top`} x1="0" y1="0" x2=".7" y2="1"><stop stopColor={bass ? '#314c47' : '#d6ae73'} /><stop offset=".32" stopColor={bass ? '#547d6c' : '#f0d199'} /><stop offset=".65" stopColor={bass ? '#29473e' : '#cea169'} /><stop offset="1" stopColor={bass ? '#152a25' : '#a87541'} /></linearGradient>
      <linearGradient id={`${instrument}Edge`}><stop stopColor="#25160f" /><stop offset=".4" stopColor="#795230" /><stop offset="1" stopColor="#2d2117" /></linearGradient>
      <linearGradient id={`${instrument}Neck`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#3e2d20" /><stop offset=".45" stopColor="#211b16" /><stop offset="1" stopColor="#443326" /></linearGradient>
      <linearGradient id={`${instrument}Metal`} x1="0" x2=".2" y2="1"><stop stopColor="#efeee2" /><stop offset=".35" stopColor="#929d9e" /><stop offset=".5" stopColor="#e8e7dc" /><stop offset="1" stopColor="#4a5359" /></linearGradient>
      <radialGradient id="soundhole"><stop stopColor="#080b0e" /><stop offset=".8" stopColor="#111315" /><stop offset="1" stopColor="#3f2b1b" /></radialGradient>
      <filter id={`${instrument}Grain`}><feTurbulence type="fractalNoise" baseFrequency=".004 .36" numOctaves="3" seed={bass ? '9' : '4'} /><feColorMatrix type="saturate" values="0" /><feComponentTransfer><feFuncA type="linear" slope=".12" /></feComponentTransfer><feComposite in2="SourceAlpha" operator="in" result="grain" /><feBlend in="SourceGraphic" in2="grain" mode="multiply" /></filter>
      <filter id={`${instrument}Shadow`} x="-20%" y="-30%" width="150%" height="180%"><feDropShadow dx="0" dy="16" stdDeviation="13" floodOpacity=".65" /></filter>
    </defs>
    <ellipse cx="460" cy="282" rx="392" ry="34" fill="#000" opacity=".25" />
    <g filter={`url(#${instrument}Shadow)`}>
      <path d={body} fill={`url(#${instrument}Edge)`} stroke="#201711" strokeWidth="8" transform="translate(0 4)" />
      <path d={body} fill={`url(#${instrument}Top)`} stroke={bass ? '#7a9781' : '#f0d3a0'} strokeWidth="2.5" filter={`url(#${instrument}Grain)`} />
      <path d={body} fill="none" stroke={bass ? '#24372c' : '#90632e'} strokeWidth=".8" />
      {!bass && <><circle cx="260" cy="172" r="57" fill="#503621" stroke="#7c562e" strokeWidth="2" /><circle cx="260" cy="172" r="53" fill="none" stroke="#e8d2a2" strokeWidth="5" /><circle cx="260" cy="172" r="49" fill="none" stroke="#755837" strokeWidth="2" /><circle cx="260" cy="172" r="45" fill="url(#soundhole)" stroke="#d2b381" strokeWidth="2" /><path d="M312 173q15 58-21 82q55-9 61-51l-12-32Z" fill="#4b2c1e" opacity=".75" /><path d="M286 76q42-8 63 18" stroke="#ffe5ba" strokeWidth="3" fill="none" opacity=".4" /></>}
      <path d="M346 133L774 130L776 209L346 208Z" fill={`url(#${instrument}Neck)`} stroke="#8f7252" strokeWidth="2" />
      {Array.from({ length: 15 }, (_, i) => <g key={i}><path d={`M${367 + i * 27} 133V208`} stroke="#211c16" strokeWidth="3.5" /><path d={`M${368 + i * 27} 133V208`} stroke={`url(#${instrument}Metal)`} strokeWidth="1.8" /></g>)}
      {[408, 462, 516, 597, 678].map(x => <circle key={x} cx={x} cy="170" r="3.5" fill="#d3c6a4" opacity=".8" />)}
      <circle cx="732" cy="155" r="3" fill="#d3c6a4" /><circle cx="732" cy="184" r="3" fill="#d3c6a4" />
      <path d="M774 130L857 110Q878 107 879 126L876 210Q875 227 854 224L774 209Z" fill={bass ? '#52745e' : '#684b30'} stroke={bass ? '#82937b' : '#ae8655'} strokeWidth="2" />
      <path d="M776 132V209" stroke="#ebdcbc" strokeWidth="6" />
      <path d="M132 122q14 4 27 0l7 96q-24-7-42 0Z" fill={`url(#${instrument}Neck)`} stroke="#513a24" strokeWidth="1.5" />
      <path d="M150 136L153 205" stroke="#dfcc9e" strokeWidth="4" />
      {Array.from({ length: bass ? 4 : 6 }, (_, i) => <circle key={i} cx="140" cy={141 + i * (bass ? 19 : 12.7)} r="2.6" fill="#ddd0af" stroke="#615345" strokeWidth="1" />)}
      {bass && <><path d="M190 105q40 32 105 30l-11 81q-54 51-124 9Z" fill="#172421" opacity=".85" /><rect x="219" y="133" width="18" height="78" rx="3" fill="#151a1b" stroke="#8e9991" strokeWidth="1" /><rect x="282" y="133" width="18" height="78" rx="3" fill="#151a1b" stroke="#8e9991" strokeWidth="1" />{[230, 259, 282].map((x, i) => <circle key={x} cx={x} cy={251 - i * 9} r="8" fill={`url(#${instrument}Metal)`} stroke="#263c30" strokeWidth="2" />)}</>}
      {Array.from({ length: bass ? 2 : 3 }, (_, i) => i).map(i => <g key={i}><path d={`M${806 + i * 23} 123v-16m0 106v16`} stroke="#848e8a" strokeWidth="5" /><rect x={799 + i * 23} y="96" width="15" height="13" rx="5" fill={`url(#${instrument}Metal)`} /><rect x={799 + i * 23} y="228" width="15" height="13" rx="5" fill={`url(#${instrument}Metal)`} /><circle cx={809 + i * 20} cy="141" r="4.5" fill={`url(#${instrument}Metal)`} /><circle cx={809 + i * 20} cy="201" r="4.5" fill={`url(#${instrument}Metal)`} /></g>)}
      <text x="842" y="175" textAnchor="middle" fill="#ddd1b1" fontSize="7" letterSpacing="1" transform="rotate(90 842 175)">RAAGROOM</text>
    </g>
  </svg>;
}
