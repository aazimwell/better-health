const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']; // index+1 = ISO weekday
export const CATEGORIES = ['Physiotherapy', 'Chiropractic', 'Rehabilitation', 'Sports Injury'] as const;

/** 'YYYY-MM-DD' → Date at local noon (avoids timezone day-shift) */
export function parseDate(d: string): Date {
  const [y, m, dd] = d.split('-').map(Number);
  return new Date(y, m - 1, dd, 12);
}
export function toISODate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
export const todayISO = () => toISODate(new Date());

export function dayShort(d: string) { return DAYS[parseDate(d).getDay()]; }
export function dayNum(d: string) { return parseDate(d).getDate(); }
export function monthShort(d: string) { return MONTHS[parseDate(d).getMonth()]; }
export function longDate(d: string) {
  const x = parseDate(d);
  return `${DAYS[x.getDay()]}, ${x.getDate()} ${MONTHS[x.getMonth()]} ${x.getFullYear()}`;
}
export function monthTitle(year: number, month: number) {
  return `${['January','February','March','April','May','June','July','August','September','October','November','December'][month]} ${year}`;
}

/** '14:30:00' → '2:30 PM' */
export function fmtTime(t?: string | null) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ap = h >= 12 ? 'PM' : 'AM';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(m).padStart(2, '0')} ${ap}`;
}
export function fmtRange(a?: string, b?: string) { return `${fmtTime(a)} – ${fmtTime(b)}`; }

export function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} d ago`;
  return new Date(iso).toLocaleDateString();
}

export function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';
}

export const money = (n: number | string) => `৳ ${Number(n).toLocaleString('en-US')}`;

/* ---------- validation ---------- */
export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
export const isPhone = (v: string) => /^\+?[0-9\s-]{7,16}$/.test(v.trim());

/** Turn raw Supabase / network errors into something a patient can understand */
export function friendlyError(e: any): string {
  const msg: string = e?.message ?? String(e ?? '');
  if (/network request failed|failed to fetch|timeout/i.test(msg)) return 'No internet connection. Please check your network and try again.';
  if (/invalid login credentials/i.test(msg)) return 'Incorrect email or password.';
  if (/email not confirmed/i.test(msg)) return 'Please confirm your email first (check your inbox), then log in.';
  if (/already registered|already been registered/i.test(msg)) return 'An account with this email already exists. Try logging in.';
  if (/password should be at least/i.test(msg)) return 'Password must be at least 6 characters.';
  if (/rate limit|too many/i.test(msg)) return 'Too many attempts. Please wait a minute and try again.';
  if (/row-level security|permission denied/i.test(msg)) return 'You do not have permission to do that.';
  if (/jwt expired|invalid jwt/i.test(msg)) return 'Your session expired. Please log in again.';
  return msg || 'Something went wrong. Please try again.';
}

export const fullDoctorName = (n?: string) => (n ? (/^dr\.?\s/i.test(n) ? n : `Dr. ${n}`) : 'Doctor');

export const TAB_SPACE = 110; // room for the floating bottom tab bar
export const isoWeekday = (d: Date = new Date()) => (d.getDay() === 0 ? 7 : d.getDay());
export const CATEGORY_TAGLINE: Record<string, string> = {
  Physiotherapy: 'Recover & Move',
  Chiropractic: 'Align & Heal',
  Rehabilitation: 'Build Strength',
  'Sports Injury': 'Get Back to Play',
};
