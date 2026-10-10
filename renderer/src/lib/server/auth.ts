import { URLS } from "@/constants/urls";
import api from "../api";
import {
  UserRegister,
  UserLogin,
  UserLoginResponse,
  UserResponse,
} from "../schema/user"; 
import { CreateUser } from "@/schema";

// --- Signin (Register) ---
export const signin = async (data: CreateUser) => {
  const response = await api.post<UserResponse, CreateUser>(URLS.users, data);
  return { data: response.data }; // <- wrap to match previous pattern
};


// --- Login ---
export const login = async (data: UserLogin) =>
  (await api.post<UserLoginResponse,UserLogin>(URLS.login, data)).data;

// --- Change Password ---
export type ChangePasswordParams = {
  email: string;
  oldpassword: string;
  newpassword: string;
};

export type ChangePasswordResponse = {
  message: string;
  success?: boolean;
};

export const changePassword = async (
  data: ChangePasswordParams,
  token: string
) => {
  const response = await api.post<ChangePasswordResponse,ChangePasswordParams>(
    URLS.updatePassword,
    data,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response;
};

export const appleLogin = async (data: { idToken: string }) =>
  (await api.post<any, { idToken: string }>(URLS.appleLogin, data)).data;
