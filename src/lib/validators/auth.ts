import { z } from "zod";

export const loginSchema = z.object({
  inviteCode: z
    .string()
    .trim()
    .min(6, "Invite code must be at least 6 characters")
    .max(128, "Invite code is too long"),
  name: z.string().trim().min(1, "Name is required").max(255, "Name is too long"),
  email: z.string().trim().email("Invalid email address").max(255, "Email is too long"),
});

export const registerSchema = z.object({
  inviteCode: z.string().min(6, "Invite code must be at least 6 characters"),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
