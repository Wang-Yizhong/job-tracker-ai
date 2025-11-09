// --- file: src/features/auth/schemas/register.schema.ts
import { z } from "zod";

export const registerSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email({ message: "Bitte gib eine gültige E-Mail-Adresse ein." }),
  password: z.string().min(8, { message: "Das Passwort muss mindestens 8 Zeichen haben." }),
  acceptTos: z.boolean().refine((v) => v === true, {
    message: "Bitte stimme zuerst den Bedingungen zu.",
  }),
});

export type RegisterValues = z.infer<typeof registerSchema>;
