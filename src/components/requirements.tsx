import { View } from 'react-native';

import { Icon, Row, T } from '@/components/ui';
import { Colors, Spacing } from '@/constants/theme';
import type { Part, Requirement } from '@/data/types';

export const PART_LABEL: Record<Part, string> = { info: 'Info part', action: 'Action part' };
export const PART_HINT: Record<Part, string> = {
  info: 'Teach it to a clan member, who checks you off.',
  action: 'Do it, then post a journal entry.',
};

/** Splits requirements into plain items and "choose N" groups, in order. */
export function groupRequirements(reqs: Requirement[]) {
  const groups: { key: string; required: number | null; items: Requirement[] }[] = [];
  for (const r of reqs) {
    const g = r.choice_group ? groups.find((x) => x.key === r.choice_group) : undefined;
    if (g) g.items.push(r);
    else groups.push({ key: r.choice_group ?? r.id, required: r.choice_group ? (r.choice_required ?? 1) : null, items: [r] });
  }
  return groups;
}

/** Read-only requirement list for one part of one level. */
export function RequirementList({ reqs, part }: { reqs: Requirement[]; part: Part }) {
  const items = reqs.filter((r) => r.part === part);
  if (items.length === 0) return null;
  return (
    <View style={{ gap: Spacing.sm }}>
      <View>
        <T variant="label">{PART_LABEL[part]}</T>
        <T variant="small">{PART_HINT[part]}</T>
      </View>
      {groupRequirements(items).map((g) => (
        <View key={g.key} style={{ gap: 6 }}>
          {g.required !== null && (
            <T variant="small" style={{ fontWeight: '700', color: Colors.accent }}>
              Choose {g.required} of {g.items.length}
            </T>
          )}
          {g.items.map((r) => (
            <Row key={r.id} style={{ alignItems: 'flex-start' }}>
              <Icon name={g.required !== null ? 'circle-outline' : 'checkbox-blank-circle'} size={g.required !== null ? 14 : 8} color={Colors.textMuted} style={{ marginTop: g.required !== null ? 4 : 7 }} />
              <T style={{ flex: 1 }}>{r.text}</T>
            </Row>
          ))}
        </View>
      ))}
    </View>
  );
}
