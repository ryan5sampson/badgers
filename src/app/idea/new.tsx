import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { Button, Field, Screen, T, attempt, notify } from '@/components/ui';
import { useStore } from '@/data/store';

export default function NewIdea() {
  const params = useLocalSearchParams<{ name?: string }>();
  const { actions } = useStore();
  const [name, setName] = useState(params.name ?? '');
  const [description, setDescription] = useState('');

  return (
    <Screen>
      <T variant="muted">Missing a badge? Share the idea. Anyone in the clan who knows the skill can turn it into a full badge.</T>
      <Field label="Badge name" value={name} onChangeText={setName} placeholder="Watercolor, Fermentation…" />
      <Field label="What would it cover?" value={description} onChangeText={setDescription} multiline placeholder="A sentence or two is plenty." />
      <Button
        label="Share idea"
        icon="lightbulb-on"
        onPress={() =>
          attempt(() => {
            actions.submitIdea(name, description);
            notify('Idea shared', 'It shows in the badge browser for your clan.');
            router.back();
          })
        }
      />
    </Screen>
  );
}
