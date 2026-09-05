import { z } from 'zod';

const passwordValidation = new RegExp(
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
);

export const signupSchema = z.object({
    name: z
    .string()
    .min(1,{message: 'Must have at least 1 character'}),

    email: z
    .string()
    .min(1, {message: 'Must have at least 1 character'})
    .email({message: 'Must be a valid email'}),

     password: z
     .string()
     .min(1, {message: 'Must have at least 1 character'})
     .regex(passwordValidation, {message: 'Your password is not valid'}),
     
     
});

export const loginSchema = z.object({
    email: z
    .string()
    .min(1, {message: 'Must have at least 1 character'})
    .email({message: 'Must be a valid email'}),

     password: z
     .string()
     .min(1, {message: 'Must have at least 1 character'})
     .regex(passwordValidation, {message: 'Your password is not valid'}),
});

