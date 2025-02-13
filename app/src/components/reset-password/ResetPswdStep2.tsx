import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';

import { Button } from '@/src/components/Button';
import { FormField } from '@/src/components/FormField';
import {
  ResetPswdStep2FormData,
  resetPswdStep2Schema,
} from '@/src/utils/validation';

const ResetPswdStep2 = ({
  onSubmit,
}: {
  onSubmit: (data: { newPassword: string; resetToken: string }) => void;
}) => {
  const { control, handleSubmit, getValues } = useForm<ResetPswdStep2FormData>({
    resolver: zodResolver(resetPswdStep2Schema),
  });

  const onFormSubmit: SubmitHandler<ResetPswdStep2FormData> = (
    data: ResetPswdStep2FormData
  ) => {
    onSubmit({
      resetToken: data.code.toLowerCase(),
      newPassword: data.password,
    });
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
            name="code"
            label="Code"
            value={value}
            onBlur={onBlur}
            handleChangeText={onChange}
            containerClassName="mt-6"
            error={error}
            // autoFocus={true}
          />
        )}
        name="code"
      />
      <Controller
        control={control}
        render={({
          field: { onChange, onBlur, value },
          fieldState: { error },
        }) => (
          <FormField
            name="password"
            label="Password"
            value={value}
            onBlur={onBlur}
            handleChangeText={onChange}
            containerClassName="mt-4"
            error={error}
          />
        )}
        name="password"
      />
      <Controller
        control={control}
        render={({
          field: { onChange, onBlur, value },
          fieldState: { error },
        }) => (
          <FormField
            name="confirm"
            label="Retype password"
            value={value}
            onBlur={onBlur}
            handleChangeText={onChange}
            containerClassName="mt-4"
            error={error}
          />
        )}
        name="confirm"
      />

      <Button
        title="Set password"
        handlePress={handleSubmit(onFormSubmit)}
        containerClassName="mt-8"
      />
    </>
  );
};

export default ResetPswdStep2;
