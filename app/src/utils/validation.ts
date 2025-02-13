import { z } from 'zod';

const email = z
  .string()
  .email({ message: 'Please provide a valid email address' });
const password = z
  .string()
  .trim()
  .max(30, 'Password should be at most 30 characters')
  .refine(
    (value) =>
      /(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{6,40}$/.test(value ?? ''),
    'Password should contain at least 6 characters, one uppercase letter and number.'
  );

const baseAuth = {
  email,
  password,
};

export const signInSchema = z.object(baseAuth);

export const signUpSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name should contain at least 2 alphabets')
    .max(30, 'Name should contain at most 30 alphabets')
    .refine(
      (value) => /^[a-zA-Z]+[-'s]?[a-zA-Z]+$/.test(value ?? ''),
      'Name should contain only alphabets'
    ),
  ...baseAuth,
});

export const resetPswdStep1Schema = z.object({
  email,
});

export const resetPswdStep2Schema = z
  .object({
    code: z.string().min(1, 'Please provide the code you have received'),
    password,
    confirm: password,
  })
  .refine((data) => data.password === data.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'], // Specify which field to attach the error to
  });

export type SignInFormData = z.infer<typeof signInSchema>;
export type SignUpFormData = z.infer<typeof signUpSchema>;
export type ResetPswdStep1FormData = z.infer<typeof resetPswdStep1Schema>;
export type ResetPswdStep2FormData = z.infer<typeof resetPswdStep2Schema>;
