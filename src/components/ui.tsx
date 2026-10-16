import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ReactNode } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ScrollViewProps,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type ViewStyle,
} from 'react-native';

import { Colors, MaxContentWidth, Radius, Spacing, type IconName } from '@/constants/theme';
import { RuleError } from '@/data/store';

export { MaterialCommunityIcons as Icon };

/** Alert.alert does nothing on web, so fall back to window.alert there. */
export function notify(title: string, message?: string) {
  if (Platform.OS === 'web') window.alert(message ? `${title}\n\n${message}` : title);
  else Alert.alert(title, message);
}

/** Runs an action and shows rule errors instead of crashing. */
export function attempt<T>(fn: () => T): T | undefined {
  try {
    return fn();
  } catch (e) {
    if (e instanceof RuleError) notify('Not quite', e.message);
    else throw e;
  }
}

export function Screen({ children, contentContainerStyle, ...props }: ScrollViewProps & { children: ReactNode }) {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.screenContent, contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
      {...props}>
      <View style={styles.column}>{children}</View>
    </ScrollView>
  );
}

type Variant = 'title' | 'heading' | 'subheading' | 'body' | 'muted' | 'small' | 'label';

export function T({ variant = 'body', style, ...props }: TextProps & { variant?: Variant }) {
  return <Text style={[styles.text, textStyles[variant], style]} {...props} />;
}

export function Button({
  label,
  onPress,
  kind = 'primary',
  icon,
  disabled,
  small,
  style,
}: {
  label: string;
  onPress: () => void;
  kind?: 'primary' | 'secondary' | 'ghost' | 'accent';
  icon?: IconName;
  disabled?: boolean;
  small?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const color = kind === 'primary' || kind === 'accent' ? Colors.primaryText : Colors.primary;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        small && styles.buttonSmall,
        buttonStyles[kind],
        disabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}>
      {icon && <MaterialCommunityIcons name={icon} size={small ? 16 : 18} color={color} />}
      <Text style={[styles.buttonLabel, small && styles.buttonLabelSmall, { color }]}>{label}</Text>
    </Pressable>
  );
}

export function Chip({ label, selected, onPress, icon }: { label: string; selected?: boolean; onPress?: () => void; icon?: IconName }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && styles.pressed]}>
      {icon && <MaterialCommunityIcons name={icon} size={14} color={selected ? Colors.primaryText : Colors.textMuted} />}
      <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{label}</Text>
    </Pressable>
  );
}

export function Card({ children, onPress, style }: { children: ReactNode; onPress?: () => void; style?: StyleProp<ViewStyle> }) {
  if (!onPress) return <View style={[styles.card, style]}>{children}</View>;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed, style]}>
      {children}
    </Pressable>
  );
}

export function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <T variant="subheading">{title}</T>
        {action}
      </View>
      {children}
    </View>
  );
}

export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const hue = [...name].reduce((h, c) => h + c.charCodeAt(0), 0) % 360;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: `hsl(${hue}, 35%, 82%)`,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text style={{ fontSize: size * 0.42, fontWeight: '700', color: `hsl(${hue}, 40%, 28%)` }}>
        {name.slice(0, 1).toUpperCase()}
      </Text>
    </View>
  );
}

export function ProgressBar({ value, total }: { value: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((value / total) * 100);
  return (
    <View style={styles.progressTrack} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: total, now: value }}>
      <View style={[styles.progressFill, { width: `${pct}%` }]} />
    </View>
  );
}

export function Empty({ icon, title, body, children }: { icon: IconName; title: string; body: string; children?: ReactNode }) {
  return (
    <View style={styles.empty}>
      <MaterialCommunityIcons name={icon} size={36} color={Colors.textMuted} />
      <T variant="subheading" style={{ textAlign: 'center' }}>
        {title}
      </T>
      <T variant="muted" style={{ textAlign: 'center' }}>
        {body}
      </T>
      {children}
    </View>
  );
}

export function Field({ label, hint, ...props }: TextInputProps & { label: string; hint?: string }) {
  return (
    <View style={{ gap: Spacing.xs }}>
      <T variant="label">{label}</T>
      <TextInput placeholderTextColor={Colors.textMuted} style={[styles.input, props.multiline && styles.inputMultiline]} {...props} />
      {hint && <T variant="small">{hint}</T>}
    </View>
  );
}

export function Pill({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'primary' | 'accent' }) {
  const bg = tone === 'primary' ? Colors.primarySoft : tone === 'accent' ? Colors.accentSoft : Colors.surfaceMuted;
  const fg = tone === 'primary' ? Colors.primary : tone === 'accent' ? Colors.accent : Colors.textMuted;
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={[styles.pillLabel, { color: fg }]}>{label}</Text>
    </View>
  );
}

export function Row({ children, style, gap = Spacing.sm }: { children: ReactNode; style?: StyleProp<ViewStyle>; gap?: number }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>;
}

export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const future = diff < 0;
  const mins = Math.round(Math.abs(diff) / 60000);
  const fmt = (n: number, unit: string) => `${n} ${unit}${n === 1 ? '' : 's'}`;
  let s: string;
  if (mins < 1) return 'just now';
  if (mins < 60) s = fmt(mins, 'minute');
  else if (mins < 60 * 24) s = fmt(Math.round(mins / 60), 'hour');
  else s = fmt(Math.round(mins / 1440), 'day');
  return future ? `in ${s}` : `${s} ago`;
}

export function formatDate(iso: string, withTime = false) {
  const d = new Date(iso);
  const date = d.toLocaleDateString(undefined, { weekday: withTime ? 'short' : undefined, month: 'short', day: 'numeric', year: withTime ? undefined : 'numeric' });
  return withTime ? `${date}, ${d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}` : date;
}

const textStyles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  heading: { fontSize: 22, fontWeight: '700' },
  subheading: { fontSize: 17, fontWeight: '700' },
  body: { fontSize: 15, lineHeight: 22 },
  muted: { fontSize: 15, lineHeight: 22, color: Colors.textMuted },
  small: { fontSize: 13, lineHeight: 18, color: Colors.textMuted },
  label: { fontSize: 13, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6 },
});

const buttonStyles = StyleSheet.create({
  primary: { backgroundColor: Colors.primary },
  accent: { backgroundColor: Colors.accent },
  secondary: { backgroundColor: Colors.primarySoft },
  ghost: { backgroundColor: 'transparent' },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  screenContent: { padding: Spacing.lg, paddingBottom: 120 },
  column: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', gap: Spacing.lg },
  text: { color: Colors.text },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.pill,
  },
  buttonSmall: { paddingHorizontal: Spacing.md, paddingVertical: 6 },
  buttonLabel: { fontSize: 15, fontWeight: '700' },
  buttonLabelSmall: { fontSize: 13 },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.75 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipLabel: { fontSize: 13, fontWeight: '600', color: Colors.text },
  chipLabelSelected: { color: Colors.primaryText },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  section: { gap: Spacing.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: Colors.surfaceMuted, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 3 },
  empty: { alignItems: 'center', gap: Spacing.sm, padding: Spacing.xl },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.text,
  },
  inputMultiline: { minHeight: 96, textAlignVertical: 'top' },
  pill: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.pill, alignSelf: 'flex-start' },
  pillLabel: { fontSize: 12, fontWeight: '700' },
});
