import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import React from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';

import { Button } from '@/src/components/Button';
import { FormField } from '@/src/components/FormField';
import {
  ResetPswdStep1FormData,
  resetPswdStep1Schema,
} from '@/src/utils/validation';

const ResetPswdStep1 = ({ onSubmit }: { onSubmit: (data: string) => void }) => {
  const router = useRouter();
  const { control, handleSubmit } = useForm<ResetPswdStep1FormData>({
    resolver: zodResolver(resetPswdStep1Schema),
  });

  const onFormSubmit: SubmitHandler<ResetPswdStep1FormData> = (
    data: ResetPswdStep1FormData
  ) => {
    onSubmit(data.email.toLowerCase());
  };

  return (
    <>
      <Controller
        control={control}
        render={({
          field: { onChange, onBlur, value },
          fieldState: { error },
        }) => (
          <FormField
            name="email"
            label="Email"
            value={value}
            onBlur={onBlur}
            handleChangeText={onChange}
            containerClassName="mt-6"
            error={error}
            keyboardType="email-address"
            // autoFocus={true}
          />
        )}
        name="email"
      />

      <Button
        title="Send code"
        handlePress={handleSubmit(onFormSubmit)}
        containerClassName="mt-8"
      />

      <Button
        title="Cancel"
        variant="secondary"
        handlePress={() => {
          router.push('/sign-in');
        }}
        containerClassName="mt-8"
      />
    </>
  );
};

export default ResetPswdStep1;
