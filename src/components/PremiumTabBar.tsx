import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, gradients } from '@/theme';
import { playClick } from '@/lib/sound';

/** Minimal shape of the props react-navigation passes to a custom tab bar. */
interface TabBarProps {
  state: { index: number; routes: { key: string; name: string; params?: object }[] };
  descriptors: Record<string, { options: any }>;
  navigation: { emit: (e: any) => { defaultPrevented: boolean }; navigate: (name: string, params?: object) => void };
}

/** Premium bottom navigation: gradient glow capsule behind the active icon, bold label, crisp badge. */
export function PremiumTabBar({ state, descriptors, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={s.topLine} />
      <View style={s.row}>
        {state.routes.map((route, i) => {
          const { options } = descriptors[route.key];
          if (options.href === null) return null;
          const focused = state.index === i;
          const label: string = options.title ?? route.name;
          const badge = options.tabBarBadge;
          const color = focused ? '#FFFFFF' : '#8197B3';
          const onPress = () => {
            const e = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !e.defaultPrevented) { playClick(); navigation.navigate(route.name, route.params); }
          };
          return (
            <Pressable key={route.key} onPress={onPress} accessibilityRole="button" accessibilityLabel={label}
              accessibilityState={focused ? { selected: true } : {}} style={s.item} android_ripple={{ color: 'transparent' }}>
              <View style={s.iconWrap}>
                {focused ? (
                  <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.capsule, s.glow]}>
                    <View pointerEvents="none" style={s.shine} />
                    {options.tabBarIcon?.({ focused, color, size: 22 })}
                  </LinearGradient>
                ) : (
                  <View style={s.capsule}>{options.tabBarIcon?.({ focused, color, size: 23 })}</View>
                )}
                {badge != null && badge !== '' && (
                  <View style={s.badge}><Text style={s.badgeText}>{String(badge)}</Text></View>
                )}
              </View>
              <Text numberOfLines={1} style={[s.label, focused && s.labelOn]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  bar: {
    position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 8,
    shadowColor: '#1A4F99', shadowOpacity: 0.16, shadowRadius: 20, shadowOffset: { width: 0, height: -6 }, elevation: 16,
  },
  topLine: { position: 'absolute', top: 0, left: 28, right: 28, height: 1, backgroundColor: 'rgba(31,123,240,0.10)' },
  row: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 6 },
  item: { flex: 1, alignItems: 'center', paddingTop: 2 },
  iconWrap: { height: 34, minWidth: 56, alignItems: 'center', justifyContent: 'center' },
  capsule: { width: 54, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  glow: { shadowColor: '#1F6FEB', shadowOpacity: 0.45, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  shine: { position: 'absolute', left: 0, right: 0, top: 0, height: '48%', backgroundColor: 'rgba(255,255,255,0.16)' },
  label: { fontSize: 11, fontWeight: '600', color: '#8197B3', marginTop: 3, marginBottom: 2 },
  labelOn: { color: colors.primaryDark, fontWeight: '800' },
  badge: {
    position: 'absolute', top: -2, right: 2, minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4,
    backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff',
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
});
