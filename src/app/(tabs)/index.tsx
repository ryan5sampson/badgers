import { router, useNavigation } from 'expo-router';
import { useLayoutEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { HeaderButton, NewEntryButton } from '@/components/header-buttons';
import { HoneycombBanner, ProgressCard } from '@/components/progress';
import { Button, Empty, Row, Section, T, attempt } from '@/components/ui';
import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useMe, useStore } from '@/data/store';
import { bannerFor, progressFor } from '@/data/rules';

/**
 * The banner fills the visible screen. In-progress and saved badges sit
 * below it, one scroll away.
 */
export default function BannerScreen() {
  const { db, actions } = useStore();
  const me = useMe();
  const navigation = useNavigation();
  const [arranging, setArranging] = useState(false);
  const [viewport, setViewport] = useState(0);
  const tiles = bannerFor(db, me.id);
  const inProgress = progressFor(db, me.id, ['in_progress', 'ready']);
  const saved = progressFor(db, me.id, ['saved']);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: arranging ? 'Arrange your banner' : `${me.name}’s banner`,
      headerRight: () => (
        <Row style={{ marginRight: 16 }}>
          {tiles.length > 1 && (
            <HeaderButton
              icon={arranging ? 'check' : 'arrow-all'}
              label={arranging ? 'Done arranging' : 'Arrange banner'}
              tone={arranging ? 'primary' : 'paper'}
              onPress={() => setArranging(!arranging)}
            />
          )}
          {!arranging && <NewEntryButton />}
        </Row>
      ),
    });
  }, [navigation, arranging, me.name, tiles.length]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.background }}
      contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 120 }}
      onLayout={(e) => setViewport(e.nativeEvent.layout.height)}>
      <View style={{ width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', gap: Spacing.lg }}>
        {arranging && <T variant="small">Tap a badge, then tap the slot where it sits on your physical banner.</T>}
        {viewport > 0 && (
          <HoneycombBanner
            db={db}
            userId={me.id}
            height={viewport - Spacing.lg * 2 - (arranging ? 26 : 0)}
            arranging={arranging}
            onPlace={(id, slot) => attempt(() => actions.placeOnBanner(id, slot))}
          />
        )}
        {tiles.length === 0 && (
          <Empty icon="hexagon-outline" title="Your banner is ready for its first badge" body="Start a badge and bring it to a sett. Every badge you earn takes a spot here.">
            <Button label="Find a badge" icon="compass" onPress={() => router.push('/browser')} />
          </Empty>
        )}

        <Section title="In progress">
          {inProgress.length === 0 ? (
            <T variant="muted">Nothing in progress. Pick something you&apos;ve been meaning to try.</T>
          ) : (
            inProgress.map((p) => <ProgressCard key={p.id} db={db} progress={p} />)
          )}
        </Section>

        {saved.length > 0 && (
          <Section title="Saved for later">
            {saved.map((p) => (
              <ProgressCard key={p.id} db={db} progress={p} />
            ))}
          </Section>
        )}
      </View>
    </ScrollView>
  );
}
