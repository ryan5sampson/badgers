import { router } from 'expo-router';
import { useState } from 'react';

import { BannerGrid, ProgressCard } from '@/components/progress';
import { Button, Empty, Row, Screen, Section, T } from '@/components/ui';
import { useMe, useStore } from '@/data/store';
import { bannerFor, progressFor } from '@/data/rules';

export default function BannerScreen() {
  const { db, actions } = useStore();
  const me = useMe();
  const [arranging, setArranging] = useState(false);
  const tiles = bannerFor(db, me.id);
  const inProgress = progressFor(db, me.id, ['in_progress', 'ready']);
  const saved = progressFor(db, me.id, ['saved']);

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <T variant="heading">{me.name}&apos;s banner</T>
        {tiles.length > 1 && (
          <Button small kind={arranging ? 'primary' : 'secondary'} icon={arranging ? 'check' : 'arrow-all'} label={arranging ? 'Done' : 'Arrange'} onPress={() => setArranging(!arranging)} />
        )}
      </Row>

      {tiles.length > 0 ? (
        <BannerGrid
          db={db}
          tiles={tiles}
          arranging={arranging}
          onMove={(id, dir) => actions.moveOnBanner(id, dir, tiles.map((t) => t.id))}
        />
      ) : (
        <Empty icon="flag-variant" title="Your banner is ready for its first badge" body="Start a badge and bring it to a sett. Every badge you earn shows up here.">
          <Button label="Find a badge" icon="compass" onPress={() => router.push('/browser')} />
        </Empty>
      )}
      {arranging && <T variant="small">Move badges to match where they sit on your physical banner.</T>}

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
    </Screen>
  );
}
