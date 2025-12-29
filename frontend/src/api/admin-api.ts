import api from './axios';

export const fetchUsers = async () => {
  const res = await api.get('/users');
  return res.data;
};

export const fetchReports = async () => {
  const res = await api.get('/reports');
  return res.data;
};