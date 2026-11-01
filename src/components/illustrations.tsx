import React from 'react';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

const SKINS = ['#F2C7A5', '#E0A982', '#C68B63', '#F6D5BC'];
const HAIRS = ['#2B2A33', '#4A3224', '#1C1C24', '#6B4A2F'];

/* ---------- Logo ---------- */
export function LogoMark({ size = 44 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id="lg1" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#3B9BFF" />
          <Stop offset="1" stopColor="#1557B0" />
        </LinearGradient>
        <LinearGradient id="lg2" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#5FD39A" />
          <Stop offset="1" stopColor="#22A66B" />
        </LinearGradient>
      </Defs>
      <Circle cx="38" cy="12" r="7" fill="url(#lg1)" />
      <Path d="M8 28 C 20 18, 36 22, 46 34 C 36 32, 22 34, 8 28 Z" fill="url(#lg1)" />
      <Path d="M14 56 C 12 40, 24 30, 40 34 C 34 46, 28 54, 14 56 Z" fill="url(#lg2)" />
      <Path d="M44 30 C 54 28, 60 36, 58 46 C 50 46, 44 40, 44 30 Z" fill="url(#lg1)" opacity={0.9} />
    </Svg>
  );
}

/* ---------- Person helper ---------- */
type PersonProps = {
  x: number; y: number; s?: number; skin?: string; hair?: string; top?: string; bottom?: string;
  coat?: boolean; female?: boolean; flip?: boolean;
};
function Person({ x, y, s = 1, skin = SKINS[0], hair = HAIRS[0], top = '#3B82F6', bottom = '#1E3A5F', coat, female, flip }: PersonProps) {
  return (
    <G transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      {/* legs */}
      <Rect x={-14} y={70} width={12} height={46} rx={6} fill={bottom} />
      <Rect x={2} y={70} width={12} height={46} rx={6} fill={bottom} />
      <Ellipse cx={-8} cy={118} rx={10} ry={5} fill="#F5F8FC" />
      <Ellipse cx={8} cy={118} rx={10} ry={5} fill="#F5F8FC" />
      {/* torso */}
      <Rect x={-22} y={20} width={44} height={58} rx={18} fill={coat ? '#FFFFFF' : top} />
      {coat && <Path d="M-6 20 L0 44 L6 20 Z" fill={top} />}
      {coat && <Path d="M0 24 L0 78" stroke="#D5E3F3" strokeWidth={1.5} />}
      {/* arms */}
      <Rect x={-31} y={24} width={12} height={40} rx={6} fill={coat ? '#FFFFFF' : top} />
      <Rect x={19} y={24} width={12} height={40} rx={6} fill={coat ? '#FFFFFF' : top} />
      <Circle cx={-25} cy={66} r={6} fill={skin} />
      <Circle cx={25} cy={66} r={6} fill={skin} />
      {/* neck + head */}
      <Rect x={-5} y={10} width={10} height={14} rx={4} fill={skin} />
      <Circle cx={0} cy={-2} r={16} fill={skin} />
      {female ? (
        <Path d="M-17 0 C -20 -22, 20 -24, 17 0 C 20 12, 14 24, 12 26 L 12 4 C 4 -4, -6 -6, -12 -8 L -12 26 C -16 24, -20 12, -17 0 Z" fill={hair} />
      ) : (
        <Path d="M-16 -3 C -18 -20, 18 -22, 16 -3 C 10 -10, -8 -12, -16 -3 Z" fill={hair} />
      )}
      <Circle cx={-5.5} cy={0} r={1.6} fill="#2B2A33" />
      <Circle cx={5.5} cy={0} r={1.6} fill="#2B2A33" />
      <Path d="M-4 7 Q0 10 4 7" stroke="#B5664A" strokeWidth={1.6} fill="none" strokeLinecap="round" />
    </G>
  );
}

/* ---------- Welcome illustration (doctor + patient) ---------- */
export function WelcomeIllustration({ width = 340, height = 250 }: { width?: number; height?: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 340 250">
      <Defs>
        <LinearGradient id="wbg" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#CFE6FF" />
          <Stop offset="1" stopColor="#EAF4FF" />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={340} height={250} fill="url(#wbg)" />
      {/* window */}
      <Rect x={190} y={14} width={130} height={110} rx={10} fill="#FFFFFF" opacity={0.6} />
      <Path d="M255 14 V124 M190 69 H320" stroke="#BBD7F5" strokeWidth={3} />
      <Ellipse cx={80} cy={40} rx={34} ry={11} fill="#FFFFFF" opacity={0.8} />
      <Ellipse cx={104} cy={34} rx={22} ry={9} fill="#FFFFFF" opacity={0.8} />
      {/* plant */}
      <Path d="M300 190 C 290 160, 296 140, 312 130 C 316 150, 312 172, 300 190 Z" fill="#7DD3A8" />
      <Path d="M300 190 C 312 170, 328 166, 336 150 C 322 150, 306 162, 300 190 Z" fill="#4FBF8A" />
      <Rect x={290} y={186} width={22} height={26} rx={5} fill="#FFFFFF" />
      {/* treatment bed */}
      <Rect x={0} y={206} width={340} height={44} fill="#2F6FD6" />
      <Rect x={0} y={206} width={340} height={10} fill="#4C8DF0" />
      {/* patient (left, holding neck) */}
      <Person x={118} y={86} s={1.05} skin={SKINS[1]} hair={HAIRS[0]} top="#3A86F5" bottom="#2A3F66" />
      <Path d="M140 120 C 150 98, 138 84, 126 82" stroke={SKINS[1]} strokeWidth={9} fill="none" strokeLinecap="round" />
      {/* doctor (right) */}
      <Person x={214} y={86} s={1.05} skin={SKINS[3]} hair={HAIRS[1]} top="#58B6E8" bottom="#4B6FA5" coat female />
      <Path d="M190 118 C 176 112, 164 108, 152 112" stroke="#FFFFFF" strokeWidth={9} fill="none" strokeLinecap="round" />
      <Circle cx={150} cy={113} r={5.5} fill={SKINS[3]} />
    </Svg>
  );
}

/* ---------- Home hero (doctor treating patient on table) ---------- */
export function HeroIllustration({ width = 150, height = 110 }: { width?: number; height?: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 150 110">
      <Rect x={14} y={70} width={132} height={16} rx={8} fill="#BFDDFB" />
      <Rect x={22} y={84} width={6} height={22} fill="#8FB8E8" />
      <Rect x={130} y={84} width={6} height={22} fill="#8FB8E8" />
      {/* patient lying */}
      <Rect x={28} y={54} width={80} height={18} rx={9} fill="#3A86F5" />
      <Rect x={96} y={58} width={30} height={12} rx={6} fill="#2A3F66" />
      <Circle cx={22} cy={58} r={11} fill={SKINS[1]} />
      <Path d="M12 56 C 14 46, 30 46, 32 56 C 26 52, 18 52, 12 56 Z" fill={HAIRS[0]} />
      {/* doctor standing */}
      <G transform="translate(78 8) scale(0.6)">
        <Rect x={-14} y={70} width={12} height={34} rx={6} fill="#4B6FA5" />
        <Rect x={2} y={70} width={12} height={34} rx={6} fill="#4B6FA5" />
        <Rect x={-22} y={20} width={44} height={58} rx={18} fill="#FFFFFF" />
        <Path d="M-6 20 L0 44 L6 20 Z" fill="#58B6E8" />
        <Rect x={-31} y={24} width={12} height={34} rx={6} fill="#FFFFFF" />
        <Rect x={19} y={24} width={12} height={34} rx={6} fill="#FFFFFF" />
        <Circle cx={-24} cy={62} r={6} fill={SKINS[3]} />
        <Circle cx={24} cy={62} r={6} fill={SKINS[3]} />
        <Circle cx={0} cy={-2} r={16} fill={SKINS[3]} />
        <Path d="M-16 -3 C -18 -20, 18 -22, 16 -3 C 10 -10, -8 -12, -16 -3 Z" fill={HAIRS[1]} />
        <Circle cx={-5.5} cy={0} r={1.6} fill="#2B2A33" />
        <Circle cx={5.5} cy={0} r={1.6} fill="#2B2A33" />
      </G>
    </Svg>
  );
}

/* ---------- Service art (one per category) ---------- */
export function ServiceArt({ category, size = 56 }: { category: string; size?: number }) {
  const bg: Record<string, string> = {
    Physiotherapy: '#DDEEFF', Chiropractic: '#E3E9FF', Rehabilitation: '#E4F6EC', 'Sports Injury': '#FFEBDD',
  };
  const c = bg[category] ?? '#DDEEFF';
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Rect width={64} height={64} rx={16} fill={c} />
      {category === 'Chiropractic' ? (
        <G>
          <Circle cx={32} cy={13} r={6} fill={SKINS[1]} />
          {[22, 29, 36, 43].map((y) => (
            <Rect key={y} x={26} y={y} width={12} height={5} rx={2.5} fill="#7C8CF0" />
          ))}
          <Path d="M24 52 L32 46 L40 52" stroke="#4C5FD5" strokeWidth={3} fill="none" strokeLinecap="round" />
        </G>
      ) : category === 'Rehabilitation' ? (
        <G>
          <Circle cx={32} cy={15} r={6} fill={SKINS[0]} />
          <Rect x={26} y={22} width={12} height={20} rx={6} fill="#22A66B" />
          <Rect x={10} y={29} width={44} height={4} rx={2} fill="#2A3F66" />
          <Rect x={6} y={24} width={6} height={14} rx={2} fill="#2A3F66" />
          <Rect x={52} y={24} width={6} height={14} rx={2} fill="#2A3F66" />
          <Rect x={27} y={42} width={4} height={14} rx={2} fill="#2A3F66" />
          <Rect x={34} y={42} width={4} height={14} rx={2} fill="#2A3F66" />
        </G>
      ) : category === 'Sports Injury' ? (
        <G>
          <Circle cx={38} cy={14} r={6} fill={SKINS[2]} />
          <Path d="M36 22 L28 36 L18 38" stroke="#F97316" strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M28 36 L36 46 L34 58" stroke="#2A3F66" strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M28 36 L22 50 L12 52" stroke="#2A3F66" strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <Circle cx={50} cy={46} r={6} fill="#FFFFFF" stroke="#F97316" strokeWidth={2} />
        </G>
      ) : (
        <G>
          <Circle cx={32} cy={14} r={6} fill={SKINS[0]} />
          <Rect x={25} y={21} width={14} height={22} rx={7} fill="#3A86F5" />
          <Path d="M25 26 L12 18 M39 26 L52 18" stroke="#3A86F5" strokeWidth={5} strokeLinecap="round" />
          <Rect x={26} y={42} width={5} height={15} rx={2.5} fill="#2A3F66" />
          <Rect x={33} y={42} width={5} height={15} rx={2.5} fill="#2A3F66" />
          <Path d="M10 22 Q32 6 54 22" stroke="#7FB5FF" strokeWidth={2} fill="none" strokeDasharray="3 3" />
        </G>
      )}
    </Svg>
  );
}

/* ---------- Doctor avatar (vector, deterministic by id) ---------- */
function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}
export function DoctorAvatar({ seed = '', size = 64, female }: { seed?: string; size?: number; female?: boolean }) {
  const h = hash(seed || 'x');
  const skin = SKINS[h % SKINS.length];
  const hair = HAIRS[(h >> 3) % HAIRS.length];
  const isF = female ?? h % 2 === 1;
  return (
    <Svg width={size} height={size} viewBox="0 0 80 80">
      <Rect width={80} height={80} rx={40} fill="#D6EAFF" />
      <G>
        <Path d="M8 80 C 8 58, 24 52, 40 52 C 56 52, 72 58, 72 80 Z" fill="#FFFFFF" />
        <Path d="M34 52 L40 66 L46 52 Z" fill="#58B6E8" />
        <Rect x={35} y={42} width={10} height={12} rx={4} fill={skin} />
        <Circle cx={40} cy={32} r={15} fill={skin} />
        {isF ? (
          <Path d="M24 34 C 20 12, 60 12, 56 34 C 58 44, 54 50, 52 52 L 52 32 C 44 26, 34 26, 28 22 L 28 52 C 26 50, 22 44, 24 34 Z" fill={hair} />
        ) : (
          <Path d="M25 30 C 23 12, 57 12, 55 30 C 50 22, 32 22, 25 30 Z" fill={hair} />
        )}
        <Circle cx={34.5} cy={34} r={1.6} fill="#2B2A33" />
        <Circle cx={45.5} cy={34} r={1.6} fill="#2B2A33" />
        <Path d="M36 41 Q40 44 44 41" stroke="#B5664A" strokeWidth={1.6} fill="none" strokeLinecap="round" />
      </G>
    </Svg>
  );
}

/* ---------- Doctor profile hero (large) ---------- */
export function DoctorHero({ seed = '', width = 340, height = 190 }: { seed?: string; width?: number; height?: number }) {
  const h = hash(seed || 'x');
  const skin = SKINS[h % SKINS.length];
  const hair = HAIRS[(h >> 3) % HAIRS.length];
  return (
    <Svg width={width} height={height} viewBox="0 0 340 190">
      <Defs>
        <LinearGradient id="dh" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#C9E3FF" />
          <Stop offset="1" stopColor="#EAF4FF" />
        </LinearGradient>
      </Defs>
      <Rect width={340} height={190} fill="url(#dh)" />
      <Path d="M20 190 C 10 150, 24 120, 48 108 C 54 140, 46 168, 20 190 Z" fill="#7DD3A8" />
      <Path d="M320 190 C 332 150, 316 120, 292 108 C 286 140, 294 168, 320 190 Z" fill="#4FBF8A" />
      <Rect x={88} y={150} width={164} height={40} rx={20} fill="#FFFFFF" />
      <G transform="translate(170 40) scale(1.5)">
        <Rect x={-28} y={30} width={56} height={70} rx={22} fill="#FFFFFF" />
        <Path d="M-8 30 L0 60 L8 30 Z" fill="#58B6E8" />
        <Rect x={-6} y={14} width={12} height={18} rx={5} fill={skin} />
        <Circle cx={0} cy={0} r={20} fill={skin} />
        <Path d="M-20 -4 C -22 -26, 22 -28, 20 -4 C 12 -14, -10 -16, -20 -4 Z" fill={hair} />
        <Circle cx={-7} cy={1} r={2} fill="#2B2A33" />
        <Circle cx={7} cy={1} r={2} fill="#2B2A33" />
        <Path d="M-5 9 Q0 13 5 9" stroke="#B5664A" strokeWidth={2} fill="none" strokeLinecap="round" />
      </G>
    </Svg>
  );
}

/* ---------- Confirmation illustration ---------- */
export function ConfirmIllustration({ size = 150, pending }: { size?: number; pending?: boolean }) {
  const accent = pending ? '#F5A524' : '#22A66B';
  return (
    <Svg width={size} height={size} viewBox="0 0 160 160">
      <Path d="M24 150 C 12 118, 26 92, 46 84 C 52 110, 46 134, 24 150 Z" fill="#7DD3A8" />
      <Path d="M138 150 C 150 118, 136 92, 116 84 C 110 110, 116 134, 138 150 Z" fill="#4FBF8A" />
      <Rect x={40} y={22} width={80} height={108} rx={12} fill="#FFFFFF" stroke="#BBD7F5" strokeWidth={3} />
      <Rect x={62} y={14} width={36} height={16} rx={6} fill="#3A86F5" />
      {[48, 72, 96].map((y) => (
        <G key={y}>
          <Rect x={50} y={y} width={12} height={12} rx={3} fill="#E3F0FF" />
          <Rect x={68} y={y + 3} width={40} height={6} rx={3} fill="#CFE2F8" />
        </G>
      ))}
      <Circle cx={112} cy={118} r={26} fill={accent} />
      {pending ? (
        <Path d="M112 104 V120 L123 126" stroke="#FFFFFF" strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <Path d="M99 118 L108 127 L126 108" stroke="#FFFFFF" strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </Svg>
  );
}

/* ---------- Empty states ---------- */
export function EmptyIllustration({ kind = 'calendar', size = 120 }: { kind?: 'calendar' | 'bell' | 'search' | 'people'; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      <Circle cx={60} cy={60} r={52} fill="#E3F0FF" />
      {kind === 'bell' ? (
        <G>
          <Path d="M60 30 C 44 30, 40 44, 40 58 L 36 76 H 84 L 80 58 C 80 44, 76 30, 60 30 Z" fill="#7FB5FF" />
          <Circle cx={60} cy={82} r={7} fill="#3A86F5" />
        </G>
      ) : kind === 'search' ? (
        <G>
          <Circle cx={54} cy={54} r={22} fill="#FFFFFF" stroke="#3A86F5" strokeWidth={6} />
          <Path d="M70 70 L88 88" stroke="#3A86F5" strokeWidth={8} strokeLinecap="round" />
        </G>
      ) : kind === 'people' ? (
        <G>
          <Circle cx={44} cy={48} r={12} fill="#7FB5FF" />
          <Rect x={28} y={62} width={32} height={26} rx={13} fill="#7FB5FF" />
          <Circle cx={78} cy={52} r={10} fill="#3A86F5" />
          <Rect x={64} y={64} width={28} height={24} rx={12} fill="#3A86F5" />
        </G>
      ) : (
        <G>
          <Rect x={30} y={36} width={60} height={50} rx={10} fill="#FFFFFF" stroke="#3A86F5" strokeWidth={4} />
          <Rect x={30} y={36} width={60} height={14} rx={7} fill="#3A86F5" />
          <Rect x={42} y={28} width={6} height={14} rx={3} fill="#1557B0" />
          <Rect x={72} y={28} width={6} height={14} rx={3} fill="#1557B0" />
          <Path d="M46 68 H74" stroke="#BBD7F5" strokeWidth={5} strokeLinecap="round" />
        </G>
      )}
    </Svg>
  );
}

/* ---------- Promo banner art (runner on hills) ---------- */
export function ProgressBannerArt({ width = 340, height = 90 }: { width?: number; height?: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 340 90" preserveAspectRatio="xMidYMid slice">
      <Defs>
        <LinearGradient id="pb" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#2F93F0" />
          <Stop offset="1" stopColor="#35C48F" />
        </LinearGradient>
      </Defs>
      <Rect width={340} height={90} fill="url(#pb)" />
      <Path d="M0 90 C 60 50, 120 60, 190 70 C 250 78, 300 56, 340 60 V90 Z" fill="#FFFFFF" opacity={0.25} />
      <Path d="M0 90 C 80 70, 150 80, 230 78 C 280 76, 320 70, 340 74 V90 Z" fill="#FFFFFF" opacity={0.35} />
      <Circle cx={250} cy={22} r={7} fill="#FFE2B8" />
      <Path d="M250 30 L244 48 L232 52 M244 48 L252 62 L250 76 M244 48 L238 64 L226 68 M250 34 L262 40" stroke="#FFFFFF" strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/* ---------- Developer placeholder (neutral, replaceable) ---------- */
export function DeveloperPlaceholder({ size = 96 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 96 96">
      <Defs>
        <LinearGradient id="dp" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#5AA9FF" />
          <Stop offset="1" stopColor="#1A73E8" />
        </LinearGradient>
      </Defs>
      <Circle cx={48} cy={48} r={48} fill="url(#dp)" />
      <Circle cx={48} cy={38} r={15} fill="#FFFFFF" opacity={0.95} />
      <Path d="M18 86 C 20 64, 34 58, 48 58 C 62 58, 76 64, 78 86 C 66 94, 30 94, 18 86 Z" fill="#FFFFFF" opacity={0.95} />
    </Svg>
  );
}
