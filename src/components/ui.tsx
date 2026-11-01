import React, { Component, ReactNode, useEffect, useState } from 'react';
import {
  ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleProp, StyleSheet, Text,
  TextInput, TextInputProps, View, ViewStyle, RefreshControl, Modal, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, radius, shadow, STATUS_STYLE } from '@/theme';
import { EmptyIllustration, DoctorAvatar } from './illustrations';
import { signedAvatarUrl } from '@/services/storage';

/* ---------- Screen wrapper ---------- */
export function Screen({
  children, scroll = true, onRefresh, refreshing = false, edges = ['top'], padded = true, keyboard = false, bottomSpace = 28,
}: {
  children: ReactNode; scroll?: boolean; onRefresh?: () => void; refreshing?: boolean;
  edges?: ('top' | 'bottom' | 'left' | 'right')[]; padded?: boolean; keyboard?: boolean; bottomSpace?: number;
}) {
  const body = scroll ? (
    <ScrollView
      contentContainerStyle={[padded && { paddingHorizontal: 18 }, { paddingBottom: bottomSpace }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} /> : undefined}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[{ flex: 1 }, padded && { paddingHorizontal: 18 }]}>{children}</View>
  );
  return (
    <LinearGradient colors={['#DCEEFF', '#EEF6FF', '#F7FBFF']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={edges}>
        {keyboard ? (
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>{body}</KeyboardAvoidingView>
        ) : body}
      </SafeAreaView>
    </LinearGradient>
  );
}

/* ---------- Header with back ---------- */
export function Header({ title, right, back = true }: { title: string; right?: ReactNode; back?: boolean }) {
  const router = useRouter();
  return (
    <View style={s.header}>
      {back ? (
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} hitSlop={12} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
      ) : <View style={{ width: 8 }} />}
      <Text style={s.headerTitle} numberOfLines={1}>{title}</Text>
      <View style={{ minWidth: 40, alignItems: 'flex-end' }}>{right}</View>
    </View>
  );
}

/* ---------- Buttons ---------- */
export function Button({
  title, onPress, variant = 'primary', loading, disabled, icon, style,
}: {
  title: string; onPress?: () => void; variant?: 'primary' | 'outline' | 'ghost' | 'danger' | 'success';
  loading?: boolean; disabled?: boolean; icon?: keyof typeof Ionicons.glyphMap; style?: StyleProp<ViewStyle>;
}) {
  const bg = variant === 'primary' ? colors.primary : variant === 'danger' ? colors.danger : variant === 'success' ? colors.success : '#FFFFFF';
  const fg = variant === 'primary' || variant === 'danger' || variant === 'success' ? '#FFF' : colors.primary;
  const off = disabled || loading;
  return (
    <Pressable
      onPress={off ? undefined : onPress}
      style={({ pressed }) => [
        s.btn,
        { backgroundColor: variant === 'ghost' ? 'transparent' : bg, borderColor: variant === 'outline' ? colors.primary : 'transparent', opacity: off ? 0.55 : pressed ? 0.85 : 1 },
        variant === 'primary' && shadow,
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={fg} /> : (
        <>
          {icon && <Ionicons name={icon} size={18} color={fg} style={{ marginRight: 8 }} />}
          <Text style={[s.btnText, { color: fg }]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

/* ---------- Input ---------- */
export function Input({
  label, error, icon, secure, ...rest
}: TextInputProps & { label?: string; error?: string; icon?: keyof typeof Ionicons.glyphMap; secure?: boolean }) {
  const [hidden, setHidden] = useState(!!secure);
  return (
    <View style={{ marginBottom: 14 }}>
      {label ? <Text style={s.label}>{label}</Text> : null}
      <View style={[s.inputWrap, error ? { borderColor: colors.danger } : null]}>
        {icon && <Ionicons name={icon} size={18} color={colors.textMuted} style={{ marginRight: 8 }} />}
        <TextInput
          {...rest}
          secureTextEntry={hidden}
          placeholderTextColor="#9FB0C6"
          style={[s.input, rest.multiline && { height: 90, textAlignVertical: 'top', paddingTop: 12 }]}
        />
        {secure && (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={10}>
            <Ionicons name={hidden ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
          </Pressable>
        )}
      </View>
      {error ? <Text style={s.error}>{error}</Text> : null}
    </View>
  );
}

/* ---------- Card / chips / badges ---------- */
export function Card({ children, style, onPress }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  const inner = <View style={[s.card, style]}>{children}</View>;
  return onPress ? <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}>{inner}</Pressable> : inner;
}

export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={[s.chip, active && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
      <Text style={[s.chipText, active && { color: '#fff' }]}>{label}</Text>
    </Pressable>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const st = STATUS_STYLE[status] ?? STATUS_STYLE.pending;
  return (
    <View style={[s.badge, { backgroundColor: st.bg }]}>
      <Text style={[s.badgeText, { color: st.fg }]}>{st.label}</Text>
    </View>
  );
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={s.sectionRow}>
      <Text style={s.sectionTitle}>{title}</Text>
      {action ? <Pressable onPress={onAction} hitSlop={8}><Text style={s.sectionAction}>{action}</Text></Pressable> : null}
    </View>
  );
}

/* ---------- Avatar (signed URL for private bucket, public URL otherwise) ---------- */
export function Avatar({ path, url, name, size = 44, seed }: { path?: string | null; url?: string | null; name?: string; size?: number; seed?: string }) {
  const [uri, setUri] = useState<string | null>(url ?? null);
  useEffect(() => {
    let live = true;
    if (url) { setUri(url); return; }
    if (path) signedAvatarUrl(path).then((u) => live && setUri(u));
    else setUri(null);
    return () => { live = false; };
  }, [path, url]);
  if (uri) return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.primarySoft }} />;
  return <DoctorAvatar seed={seed ?? name ?? ''} size={size} />;
}

/* ---------- States ---------- */
export function Loading({ label }: { label?: string }) {
  return (
    <View style={{ padding: 40, alignItems: 'center' }}>
      <ActivityIndicator size="large" color={colors.primary} />
      {label ? <Text style={{ color: colors.textMuted, marginTop: 10 }}>{label}</Text> : null}
    </View>
  );
}

export function EmptyState({ title, message, kind = 'calendar', action }: {
  title: string; message?: string; kind?: 'calendar' | 'bell' | 'search' | 'people'; action?: ReactNode;
}) {
  return (
    <View style={{ alignItems: 'center', padding: 28 }}>
      <EmptyIllustration kind={kind} />
      <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text, marginTop: 12 }}>{title}</Text>
      {message ? <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 6 }}>{message}</Text> : null}
      {action ? <View style={{ marginTop: 14 }}>{action}</View> : null}
    </View>
  );
}

export function ErrorView({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={{ alignItems: 'center', padding: 28 }}>
      <Ionicons name="cloud-offline-outline" size={44} color={colors.danger} />
      <Text style={{ color: colors.text, fontWeight: '700', marginTop: 10 }}>Something went wrong</Text>
      <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 4 }}>{message}</Text>
      {onRetry ? <Button title="Try again" variant="outline" onPress={onRetry} style={{ marginTop: 14, paddingHorizontal: 28 }} /> : null}
    </View>
  );
}

export function Banner({ type, text }: { type: 'error' | 'success' | 'info'; text: string }) {
  const c = type === 'error' ? [colors.dangerSoft, colors.danger] : type === 'success' ? [colors.successSoft, colors.success] : [colors.primarySoft, colors.primary];
  return (
    <View style={{ backgroundColor: c[0], borderRadius: radius.md, padding: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'center' }}>
      <Ionicons name={type === 'error' ? 'alert-circle' : type === 'success' ? 'checkmark-circle' : 'information-circle'} size={18} color={c[1]} />
      <Text style={{ color: c[1], marginLeft: 8, flex: 1, fontSize: 13 }}>{text}</Text>
    </View>
  );
}

export function Row({ icon, label, value, onPress, danger, last }: {
  icon: keyof typeof Ionicons.glyphMap; label: string; value?: string; onPress?: () => void; danger?: boolean; last?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={[s.menuRow, !last && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
      <Ionicons name={icon} size={20} color={danger ? colors.danger : colors.primary} />
      <Text style={[s.menuLabel, danger && { color: colors.danger }]}>{label}</Text>
      {value ? <Text style={{ color: colors.textMuted, marginRight: 6, fontSize: 12 }}>{value}</Text> : null}
      {onPress && !danger ? <Ionicons name="chevron-forward" size={18} color={colors.textMuted} /> : null}
    </Pressable>
  );
}

/* ---------- Bottom-sheet style modal ---------- */
export function FormModal({ visible, title, onClose, children }: { visible: boolean; title: string; onClose: () => void; children: ReactNode }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(15,42,74,0.45)', justifyContent: 'flex-end' }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, maxHeight: '90%' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
              <Text style={{ flex: 1, fontSize: 18, fontWeight: '800', color: colors.text }}>{title}</Text>
              <Pressable onPress={onClose} hitSlop={10}><Ionicons name="close" size={24} color={colors.textMuted} /></Pressable>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>{children}</ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

/** Promise-based confirmation dialog for destructive actions. */
export function confirmAction(title: string, message: string, confirmLabel = 'Confirm', destructive = true): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: confirmLabel, style: destructive ? 'destructive' : 'default', onPress: () => resolve(true) },
    ], { cancelable: true, onDismiss: () => resolve(false) });
  });
}

/* ---------- Error boundary ---------- */
export class ErrorBoundary extends Component<{ children: ReactNode }, { err?: Error }> {
  state: { err?: Error } = {};
  static getDerivedStateFromError(err: Error) { return { err }; }
  render() {
    if (this.state.err) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.bg }}>
          <ErrorView message={this.state.err.message} onRetry={() => this.setState({ err: undefined })} />
        </View>
      );
    }
    return this.props.children;
  }
}

/* ---------- Image used by Image ---------- */
export { Image };

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 18 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginRight: 10, ...shadow, shadowOpacity: 0.06, elevation: 2 },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '700', color: colors.text },
  btn: { minHeight: 52, borderRadius: radius.md, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  btnText: { fontSize: 16, fontWeight: '700' },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, paddingHorizontal: 14, minHeight: 52 },
  input: { flex: 1, fontSize: 15, color: colors.text, paddingVertical: 10 },
  error: { color: colors.danger, fontSize: 12, marginTop: 4 },
  card: { backgroundColor: '#fff', borderRadius: radius.lg, padding: 14, borderWidth: 1, borderColor: '#E6F0FB', ...shadow },
  chip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: radius.pill, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, marginRight: 8 },
  chipText: { color: colors.text, fontSize: 13, fontWeight: '600' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, alignSelf: 'flex-start' },
  badgeText: { fontSize: 11, fontWeight: '700' },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 10 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  sectionAction: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  menuRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 4 },
  menuLabel: { flex: 1, marginLeft: 14, fontSize: 15, color: colors.text, fontWeight: '500' },
});
