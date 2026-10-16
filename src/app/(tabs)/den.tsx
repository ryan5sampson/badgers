import { router, useNavigation } from 'expo-router';
import { useLayoutEffect, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { BadgeArt } from '@/components/badge-art';
import { JournalCard } from '@/components/journal';
import { Avatar, Button, Card, Chip, Field, Icon, Row, Screen, Section, T, attempt, formatDate, timeAgo } from '@/components/ui';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useMe, useStore } from '@/data/store';
import { byId, denFeed, isClanLead, userName, waitingOn, type FeedItem } from '@/data/rules';
import type { Db, RsvpStatus } from '@/data/types';

type Tab = 'updates' | 'chat' | 'events';

export default function DenScreen() {
  const { db } = useStore();
  const me = useMe();
  const navigation = useNavigation();
  const [tab, setTab] = useState<Tab>('updates');
  const clan = db.clans[0];

  useLayoutEffect(() => {
    navigation.setOptions({ headerTitle: clan.name });
  }, [navigation, clan.name]);

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <Row>
          <Chip label="Updates" selected={tab === 'updates'} onPress={() => setTab('updates')} />
          <Chip label="Chat" selected={tab === 'chat'} onPress={() => setTab('chat')} />
          <Chip label="Events" selected={tab === 'events'} onPress={() => setTab('events')} />
        </Row>
        <Button small kind="ghost" icon="account-group" label="Clan" onPress={() => router.push('/clan')} />
      </Row>

      {tab === 'updates' && (
        <>
          <WaitingOnYou db={db} />
          {isClanLead(db, me.id) && <LeadTools db={db} />}
          <Section title="Clan updates">
            {denFeed(db, clan.id)
              .slice(0, 30)
              .map((item) => (
                <FeedCard key={`${item.kind}-${item.kind === 'journal' ? item.entry.id : item.progress.id}`} db={db} item={item} />
              ))}
          </Section>
        </>
      )}
      {tab === 'chat' && <Chat db={db} />}
      {tab === 'events' && <Events db={db} />}
    </Screen>
  );
}

/** Check-off requests and awards waiting on the signed-in member. */
function WaitingOnYou({ db }: { db: Db }) {
  const { actions } = useStore();
  const me = useMe();
  const { requests, awards } = waitingOn(db, me.id);
  if (requests.length + awards.length === 0) return null;
  return (
    <Section title="Waiting on you">
      {requests.map((r) => {
        const p = byId(db.badge_progress, r.progress_id);
        const badge = p && byId(db.badges, p.badge_id);
        const req = byId(db.requirements, r.requirement_id);
        if (!p || !badge || !req) return null;
        return (
          <Card key={r.id} style={{ borderColor: Colors.primary }}>
            <T>
              <T style={{ fontWeight: '700' }}>{userName(db, p.user_id)}</T> says they taught you the {badge.name} info part:
            </T>
            <T variant="muted">{req.text}</T>
            <Row>
              <Button small label="Confirm" icon="check" onPress={() => attempt(() => actions.confirmCheckoff(r.id))} />
              <Button small kind="ghost" label="Not yet" onPress={() => actions.cancelCheckoffRequest(r.id)} />
            </Row>
          </Card>
        );
      })}
      {awards.map((p) => {
        const badge = byId(db.badges, p.badge_id);
        if (!badge) return null;
        return (
          <Card key={p.id} onPress={() => router.push({ pathname: '/progress/[id]', params: { id: p.id } })} style={{ borderColor: Colors.accent }}>
            <Row gap={Spacing.md}>
              <BadgeArt badge={badge} size={40} />
              <T style={{ flex: 1 }}>
                <T style={{ fontWeight: '700' }}>{userName(db, p.user_id)}</T>&apos;s {badge.name} {p.level} badge is ready for award.
              </T>
              <Icon name="chevron-right" size={20} color={Colors.textMuted} />
            </Row>
          </Card>
        );
      })}
    </Section>
  );
}

function LeadTools({ db }: { db: Db }) {
  const { actions } = useStore();
  const clan = db.clans[0];
  return (
    <Card>
      <Row style={{ justifyContent: 'space-between' }}>
        <T variant="label">Clan lead tools</T>
        <Icon name="shield-star" size={18} color={Colors.accent} />
      </Row>
      <Row style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <T>
          Invite code: <T style={{ fontWeight: '800', letterSpacing: 1 }}>{clan.invite_code}</T>
        </T>
        <Button small kind="ghost" label="New code" onPress={() => attempt(() => actions.newInviteCode())} />
      </Row>
      <T variant="small">Remove duplicate badges from the badge&apos;s page. Schedule setts from the Events tab.</T>
    </Card>
  );
}

function FeedCard({ db, item }: { db: Db; item: FeedItem }) {
  if (item.kind === 'journal') return <JournalCard db={db} entry={item.entry} />;
  const badge = byId(db.badges, item.progress.badge_id);
  if (!badge) return null;
  const name = userName(db, item.progress.user_id);
  const awarded = item.kind === 'awarded';
  return (
    <Card onPress={() => router.push({ pathname: '/progress/[id]', params: { id: item.progress.id } })}>
      <Row gap={Spacing.md}>
        <BadgeArt badge={badge} size={40} level={awarded ? item.progress.level : null} />
        <T style={{ flex: 1 }}>
          <T style={{ fontWeight: '700' }}>{name}</T>
          {awarded ? ' earned ' : ' started '}
          <T style={{ fontWeight: '700' }}>{badge.name}</T>
          {item.progress.level === 'master' ? ' (master)' : ''}
          {awarded ? ' 🎉' : ''}
        </T>
        <T variant="small">{timeAgo(item.at)}</T>
      </Row>
    </Card>
  );
}

function Chat({ db }: { db: Db }) {
  const { actions } = useStore();
  const me = useMe();
  const [draft, setDraft] = useState('');
  const messages = [...db.messages].sort((a, b) => a.created_at.localeCompare(b.created_at));
  const send = () => {
    actions.sendMessage(draft);
    setDraft('');
  };
  return (
    <View style={{ gap: Spacing.sm }}>
      {messages.map((m) => {
        const mine = m.user_id === me.id;
        return (
          <View key={m.id} style={{ flexDirection: mine ? 'row-reverse' : 'row', gap: Spacing.sm, alignItems: 'flex-end' }}>
            {!mine && <Avatar name={userName(db, m.user_id)} size={28} />}
            <View style={{ maxWidth: '78%', gap: 2, alignItems: mine ? 'flex-end' : 'flex-start' }}>
              {!mine && <T variant="small">{userName(db, m.user_id)}</T>}
              <View style={{ backgroundColor: mine ? Colors.primary : Colors.surface, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderWidth: mine ? 0 : 1, borderColor: Colors.border }}>
                <T style={{ color: mine ? Colors.primaryText : Colors.text }}>{m.body}</T>
              </View>
              <T variant="small">{timeAgo(m.created_at)}</T>
            </View>
          </View>
        );
      })}
      <Row style={{ marginTop: Spacing.sm }}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={send}
          placeholder="Message your clan"
          placeholderTextColor={Colors.textMuted}
          accessibilityLabel="Message your clan"
          style={{ flex: 1, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.pill, paddingHorizontal: Spacing.lg, paddingVertical: 10, fontSize: 15, color: Colors.text }}
        />
        <Pressable accessibilityRole="button" accessibilityLabel="Send" onPress={send} style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="send" size={20} color={Colors.primaryText} />
        </Pressable>
      </Row>
    </View>
  );
}

const RSVP_LABEL: Record<RsvpStatus, string> = { going: 'Going', maybe: 'Maybe', not_going: 'Can’t make it' };

function Events({ db }: { db: Db }) {
  const { actions } = useStore();
  const me = useMe();
  const [adding, setAdding] = useState(false);
  const events = [...db.events].sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  return (
    <View style={{ gap: Spacing.md }}>
      {events.map((e) => {
        const rsvps = db.event_rsvps.filter((r) => r.event_id === e.id);
        const mine = rsvps.find((r) => r.user_id === me.id)?.status;
        const going = rsvps.filter((r) => r.status === 'going');
        return (
          <Card key={e.id}>
            <T variant="subheading">{e.title}</T>
            <Row>
              <Icon name="calendar" size={16} color={Colors.textMuted} />
              <T variant="muted">{formatDate(e.starts_at, true)}</T>
            </Row>
            <Row>
              <Icon name="map-marker-outline" size={16} color={Colors.textMuted} />
              <T variant="muted">{e.location}</T>
            </Row>
            {!!e.notes && <T>{e.notes}</T>}
            <Row style={{ flexWrap: 'wrap' }}>
              {(Object.keys(RSVP_LABEL) as RsvpStatus[]).map((s) => (
                <Chip key={s} label={RSVP_LABEL[s]} selected={mine === s} onPress={() => actions.rsvp(e.id, s)} />
              ))}
            </Row>
            <T variant="small">{going.length > 0 ? `Going: ${going.map((r) => userName(db, r.user_id)).join(', ')}` : 'No one has said they’re going yet.'}</T>
          </Card>
        );
      })}
      {isClanLead(db, me.id) && (adding ? <NewEvent onDone={() => setAdding(false)} /> : <Button label="Schedule an event" kind="secondary" icon="calendar-plus" onPress={() => setAdding(true)} />)}
    </View>
  );
}

/** Clan lead form. Dates are typed for now; a date picker comes later. */
function NewEvent({ onDone }: { onDone: () => void }) {
  const { actions } = useStore();
  const [title, setTitle] = useState('');
  const [when, setWhen] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  return (
    <Card>
      <Field label="Title" value={title} onChangeText={setTitle} placeholder="December sett" />
      <Field label="When" value={when} onChangeText={setWhen} placeholder="2026-12-05 18:30" />
      <Field label="Where" value={location} onChangeText={setLocation} placeholder="Ryan's garage" />
      <Field label="Notes" value={notes} onChangeText={setNotes} multiline placeholder="What's happening" />
      <Row>
        <Button
          label="Add event"
          onPress={() =>
            attempt(() => {
              const date = new Date(when.replace(' ', 'T'));
              actions.addEvent({ title, starts_at: (isNaN(date.getTime()) ? new Date() : date).toISOString(), location, notes });
              onDone();
            })
          }
        />
        <Button label="Cancel" kind="ghost" onPress={onDone} />
      </Row>
    </Card>
  );
}
