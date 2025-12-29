import api from './axios';

export const loginRequest = async (data: {
  email: string;
  password: string;
}) => {
  const res = await api.post('/auth/login', data);
  return res.data;
};

export const registerRequest = async (data: {
  username: string;
  email: string;
  password: string;
}) => {
  const res = await api.post('/auth/register', data);
  return res.data;
};

export const forgotPasswordRequest = async (email: string) => {
  const res = await api.post('/auth/forgot-password', { email });
  return res.data;
};

export const resetPasswordRequest = async (
  token: string,
  password: string
) => {
  const res = await api.post(`/auth/reset-password/${token}`, {
    password,
  });
  return res.data;
};