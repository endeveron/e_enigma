import React, { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/Button';
import { FormField } from '@/components/FormField';
import { deleteMessage } from '@/functions/db';
import { useToast } from '@/hooks/useToast';

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
