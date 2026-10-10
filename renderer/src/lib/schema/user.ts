import { z } from "zod";

// --- Role Enum ---
export const RoleEnum = z.enum(["ADMIN", "USER"]);
export type Role = z.infer<typeof RoleEnum>;

// --- User Register Schema ---
export const UserRegisterSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Please confirm your password'),
    role: RoleEnum.optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });
    export const createUserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  password: z.string().min(6),
  role: RoleEnum,
});
export type CreateUser = z.infer<typeof createUserSchema>;
export type UserRegister = z.infer<typeof UserRegisterSchema>;

// --- User Login Schema ---
export const UserLoginSchema = z.object({
  email: z.string({ message: "Email is required" }),
  password: z.string({ message: "Password is required" }).min(4),
});
export type UserLogin = z.infer<typeof UserLoginSchema>;

// --- User Response Schema ---
export const UserResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: RoleEnum,
  token: z.string(),
});	
export type UserResponse = z.infer<typeof UserResponseSchema>;

// --- User List Response Schema ---
export const UserListResponseSchema = z.array(UserResponseSchema);
export type UserListResponse = z.infer<typeof UserListResponseSchema>;

// --- User Login Response Schema ---
export const UserLoginResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: RoleEnum, // keep consistent with RoleEnum
  email: z.string(),
  token: z.string(),
});
export type UserLoginResponse = z.infer<typeof UserLoginResponseSchema>;

// --- Reset Password Schema ---
export const ResetPasswordSchema = z.object({
  email: z.string({ message: "Email is required" }),
  oldpassword: z.string({ message: "Old Password is required" }).min(4),
  newPassword: z.string({ message: "Password is required" }).min(4),
});

