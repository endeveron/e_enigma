import React, { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/src/components/Button';
import { FormField } from '@/src/components/FormField';
import { deleteMessage } from '@/src/functions/db';
import { useToast } from '@/src/hooks/useToast';

// Removes message from local db
const RemoveMessage = () => {
  const { showToast } = useToast();
  const [value, setValue] = useState('');

  const handleSubmit = async () => {
    const data = value.trim();
    if (!data || data.length !== 24) {
      showToast('Invalid ID');
      return;
    }
    const success = await deleteMessage(value);
    const msg = success ? 'Message deleted' : 'Error';
    showToast(msg);
    success && setValue('');
  };

  return (
    <View className="flex-row gap-4 p-4">
      <FormField
        name="removeMessage"
        value={value}
        handleChangeText={setValue}
        containerClassName="flex-1"
      />
      <Button title="Delete" variant="secondary" handlePress={handleSubmit} />
    </View>
  );
};

export default RemoveMessage;
