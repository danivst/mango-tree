import { Response } from 'express';
import Notification from '../models/notification';
import { AuthRequest } from '../utils/auth';

/* ---------- GET NOTIFICATIONS ---------- */
export const getNotifications = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const userId = req.user!.userId;

    const notifications = await Notification.find({ userId }).sort({
      createdAt: -1,
    });

    return res.json(notifications);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/* ---------- MARK SINGLE AS READ ---------- */
export const markAsRead = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found.' });
    }

    return res.json({ message: 'Notification marked as read', notification });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/* ---------- MARK ALL AS READ ---------- */
export const markAllAsRead = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const userId = req.user!.userId;

    await Notification.updateMany({ userId, read: false }, { read: true });

    return res.json({ message: 'All notifications marked as read' });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/* ---------- DELETE SINGLE NOTIFICATION ---------- */
export const deleteNotification = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const notification = await Notification.findOneAndDelete({ _id: id, userId });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found.' });
    }

    return res.json({ message: 'Notification deleted', notification });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/* ---------- DELETE ALL NOTIFICATIONS ---------- */
export const deleteAllNotifications = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const userId = req.user!.userId;

    await Notification.deleteMany({ userId });

    return res.json({ message: 'All notifications deleted' });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};