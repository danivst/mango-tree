import api from './axios';

export const fetchNotifications = async () => {
  const res = await api.get('/notifications');
  return res.data;
};