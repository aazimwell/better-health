import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Circle, Defs, G, LinearGradient as SvgGradient, Path, Rect, Stop } from 'react-native-svg';

/* =====================================================================
   Better Health — clean, geometric illustration set.
   No cartoon people: gradients, shapes and icons only, so everything
   looks intentional and consistent.
   ===================================================================== */

/* ---------- Logo ---------- */
export function LogoMark({ size = 44, mono }: { size?: number; mono?: boolean }) {
  const a = mono ? '#FFFFFF' : 'url(#lg1)';
  const b = mono ? '#FFFFFF' : 'url(#lg2)';
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <SvgGradient id="lg1" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor="#3B9BFF" /><Stop offset="1" stopColor="#1557B0" /></SvgGradient>
        <SvgGradient id="lg2" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor="#5FD39A" /><Stop offset="1" stopColor="#22A66B" /></SvgGradient>
      </Defs>
      <Circle cx="38" cy="12" r="7" fill={a} />
      <Path d="M8 28 C 20 18, 36 22, 46 34 C 36 32, 22 34, 8 28 Z" fill={a} />
      <Path d="M14 56 C 12 40, 24 30, 40 34 C 34 46, 28 54, 14 56 Z" fill={b} />
      <Path d="M44 30 C 54 28, 60 36, 58 46 C 50 46, 44 40, 44 30 Z" fill={a} opacity={0.9} />
    </Svg>
  );
}

/* ---------- Service art: gradient tile + meaningful icon ---------- */
type MCI = keyof typeof MaterialCommunityIcons.glyphMap;
const SERVICE_STYLE: Record<string, { icon: MCI; from: string; to: string }> = {
  Physiotherapy: { icon: 'human-handsup', from: '#4DA3FF', to: '#1A73E8' },
  Chiropractic: { icon: 'bone', from: '#8E9BFF', to: '#5B6CF0' },
  Rehabilitation: { icon: 'dumbbell', from: '#52D6A0', to: '#1E9E6A' },
  'Sports Injury': { icon: 'run-fast', from: '#FFAA5C', to: '#F26B1D' },
};
export function ServiceArt({ category, size = 56 }: { category: string; size?: number }) {
  const st = SERVICE_STYLE[category] ?? SERVICE_STYLE.Physiotherapy;
  return (
    <LinearGradient colors={[st.from, st.to]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={{ width: size, height: size, borderRadius: size * 0.3, alignItems: 'center', justifyContent: 'center' }}>
      <MaterialCommunityIcons name={st.icon} size={size * 0.56} color="#FFFFFF" />
    </LinearGradient>
  );
}

/* ---------- Avatar (initials on a stable gradient) ---------- */
const AV_COLORS: [string, string][] = [['#4DA3FF', '#1A73E8'], ['#52D6A0', '#1E9E6A'], ['#8E9BFF', '#5B6CF0'], ['#FFAA5C', '#F26B1D'], ['#5CC7D6', '#1790A3']];
function hash(s: string) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
function initials(name?: string) {
  const parts = (name ?? '').replace(/^dr\.?\s+/i, '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  return ((parts[0][0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}
export function DoctorAvatar({ seed = '', name, size = 64 }: { seed?: string; name?: string; size?: number; female?: boolean }) {
  const c = AV_COLORS[hash(seed || name || 'x') % AV_COLORS.length];
  const t = initials(name);
  return (
    <LinearGradient colors={c} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }}>
      {t ? <Text style={{ color: '#fff', fontWeight: '800', fontSize: size * 0.38 }}>{t}</Text>
        : <MaterialCommunityIcons name="account" size={size * 0.6} color="#fff" />}
    </LinearGradient>
  );
}

/* ---------- Decorative soft background shapes ---------- */
function SoftShapes({ w, h }: { w: number; h: number }) {
  return (
    <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: 'absolute', left: 0, top: 0 }}>
      <Circle cx={w * 0.88} cy={h * 0.12} r={h * 0.28} fill="#FFFFFF" opacity={0.18} />
      <Circle cx={w * 0.08} cy={h * 0.9} r={h * 0.34} fill="#FFFFFF" opacity={0.12} />
      <Circle cx={w * 0.62} cy={h * 0.95} r={h * 0.18} fill="#FFFFFF" opacity={0.1} />
    </Svg>
  );
}

/* ---------- Welcome illustration ---------- */
export function WelcomeIllustration({ width = 340, height = 250 }: { width?: number; height?: number }) {
  const cx = width / 2;
  const cy = height * 0.5;
  const R = Math.min(width, height) * 0.36;
  const chip = (x: number, y: number, icon: MCI, color: string, size = 46) => (
    <View key={icon} style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, borderRadius: size * 0.32, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#1A4F99', shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5 }}>
      <MaterialCommunityIcons name={icon} size={size * 0.56} color={color} />
    </View>
  );
  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Defs>
          <SvgGradient id="wbg" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#CFE6FF" /><Stop offset="1" stopColor="#EAF4FF" /></SvgGradient>
          <SvgGradient id="wc" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor="#3B9BFF" /><Stop offset="1" stopColor="#1557B0" /></SvgGradient>
        </Defs>
        <Rect width={width} height={height} fill="url(#wbg)" />
        <Circle cx={cx} cy={cy} r={R * 1.55} fill="#FFFFFF" opacity={0.35} />
        <Circle cx={cx} cy={cy} r={R * 1.18} fill="#FFFFFF" opacity={0.5} />
        <Circle cx={cx} cy={cy} r={R} fill="url(#wc)" />
        <Rect x={0} y={height - 14} width={width} height={14} fill="#2F6FD6" />
      </Svg>
      <View style={{ position: 'absolute', left: cx - R * 0.62, top: cy - R * 0.62 }}><LogoMark size={R * 1.24} mono /></View>
      {chip(cx - R * 1.45, cy - R * 0.55, 'heart-pulse', '#E5484D')}
      {chip(cx + R * 1.45, cy - R * 0.7, 'human-handsup', '#1A73E8')}
      {chip(cx - R * 1.25, cy + R * 0.85, 'dumbbell', '#1E9E6A', 42)}
      {chip(cx + R * 1.3, cy + R * 0.75, 'calendar-check', '#F26B1D', 42)}
    </View>
  );
}

/* ---------- Home hero art ---------- */
export function HeroIllustration({ width = 150, height = 110 }: { width?: number; height?: number }) {
  const s = Math.min(width, height);
  return (
    <View style={{ width, height, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ position: 'absolute', width: s * 0.95, height: s * 0.95, borderRadius: s, backgroundColor: 'rgba(255,255,255,0.16)' }} />
      <View style={{ width: s * 0.72, height: s * 0.72, borderRadius: s * 0.24, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#0B3A80', shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6 }}>
        <LogoMark size={s * 0.5} />
      </View>
      <View style={{ position: 'absolute', right: 2, top: 4, width: s * 0.3, height: s * 0.3, borderRadius: s * 0.1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
        <MaterialCommunityIcons name="heart-pulse" size={s * 0.2} color="#E5484D" />
      </View>
      <View style={{ position: 'absolute', left: 2, bottom: 6, width: s * 0.3, height: s * 0.3, borderRadius: s * 0.1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
        <MaterialCommunityIcons name="shield-check" size={s * 0.2} color="#1E9E6A" />
      </View>
    </View>
  );
}

/* ---------- Doctor profile header ---------- */
export function DoctorHero({ seed = '', width = 340, height = 190 }: { seed?: string; width?: number; height?: number }) {
  void seed;
  return (
    <View style={{ width, height, overflow: 'hidden' }}>
      <LinearGradient colors={['#1450C8', '#1F7BF0', '#2AA7C9', '#35C48F']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width, height }} />
      <SoftShapes w={width} h={height} />
      <View style={{ position: 'absolute', right: 26, top: 46, opacity: 0.22 }}><MaterialCommunityIcons name="stethoscope" size={110} color="#fff" /></View>
      <View style={{ position: 'absolute', left: 24, top: 70, opacity: 0.2 }}><MaterialCommunityIcons name="heart-pulse" size={64} color="#fff" /></View>
    </View>
  );
}

/* ---------- Confirmation illustration ---------- */
export function ConfirmIllustration({ size = 150, pending }: { size?: number; pending?: boolean }) {
  const accent = pending ? '#F5A524' : '#22A66B';
  return (
    <Svg width={size} height={size} viewBox="0 0 160 160">
      <Circle cx={80} cy={80} r={74} fill={pending ? '#FFF3DC' : '#E5F7EE'} />
      <Circle cx={80} cy={80} r={56} fill={pending ? '#FFE3A8' : '#BDEBD3'} />
      <Rect x={50} y={34} width={60} height={80} rx={10} fill="#FFFFFF" stroke="#BBD7F5" strokeWidth={3} />
      <Rect x={66} y={28} width={28} height={12} rx={5} fill="#3A86F5" />
      {[56, 74, 92].map((y) => (<G key={y}><Rect x={58} y={y} width={9} height={9} rx={2.5} fill="#E3F0FF" /><Rect x={72} y={y + 2} width={30} height={5} rx={2.5} fill="#CFE2F8" /></G>))}
      <Circle cx={108} cy={112} r={24} fill={accent} />
      {pending
        ? <Path d="M108 99 V113 L118 119" stroke="#FFFFFF" strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        : <Path d="M97 112 L105 120 L120 103" stroke="#FFFFFF" strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />}
    </Svg>
  );
}

/* ---------- Empty states ---------- */
export function EmptyIllustration({ kind = 'calendar', size = 120 }: { kind?: 'calendar' | 'bell' | 'search' | 'people'; size?: number }) {
  const icon: MCI = kind === 'bell' ? 'bell-outline' : kind === 'search' ? 'magnify' : kind === 'people' ? 'account-group-outline' : 'calendar-blank-outline';
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ position: 'absolute', width: size, height: size, borderRadius: size / 2, backgroundColor: '#E3F0FF' }} />
      <View style={{ position: 'absolute', width: size * 0.74, height: size * 0.74, borderRadius: size / 2, backgroundColor: '#CFE4FB' }} />
      <MaterialCommunityIcons name={icon} size={size * 0.44} color="#1A73E8" />
    </View>
  );
}

/* ---------- Promo banner art (fills any width) ---------- */
export function ProgressBannerArt({ width = '100%' as number | string, height = '100%' as number | string }) {
  return (
    <Svg width={width as any} height={height as any} viewBox="0 0 340 90" preserveAspectRatio="xMidYMid slice">
      <Defs>
        <SvgGradient id="pb" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor="#1F7BF0" /><Stop offset="0.55" stopColor="#2AA7C9" /><Stop offset="1" stopColor="#35C48F" /></SvgGradient>
      </Defs>
      <Rect width={340} height={90} fill="url(#pb)" />
      <Circle cx={300} cy={20} r={46} fill="#FFFFFF" opacity={0.14} />
      <Circle cx={250} cy={86} r={36} fill="#FFFFFF" opacity={0.12} />
      <Path d="M0 90 C 80 66, 150 78, 230 74 C 280 72, 320 66, 340 70 V90 Z" fill="#FFFFFF" opacity={0.28} />
      <Path d="M200 66 L226 46 L246 56 L274 26" stroke="#FFFFFF" strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={274} cy={26} r={6} fill="#FFFFFF" />
    </Svg>
  );
}

/* ---------- Developer placeholder (neutral, replaceable) ---------- */
export function DeveloperPlaceholder({ size = 96 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 96 96">
      <Defs><SvgGradient id="dp" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor="#5AA9FF" /><Stop offset="1" stopColor="#1A73E8" /></SvgGradient></Defs>
      <Circle cx={48} cy={48} r={48} fill="url(#dp)" />
      <Circle cx={48} cy={38} r={15} fill="#FFFFFF" opacity={0.95} />
      <Path d="M18 86 C 20 64, 34 58, 48 58 C 62 58, 76 64, 78 86 C 66 94, 30 94, 18 86 Z" fill="#FFFFFF" opacity={0.95} />
    </Svg>
  );
}
