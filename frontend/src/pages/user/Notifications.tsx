import { useEffect, useState } from 'react';
import { fetchNotifications } from '../../api/notification-api';

const Notifications = () => {
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    fetchNotifications().then(setNotifications);
  }, []);

  return (
    <div>
      <h2>Notifications</h2>
      {notifications.map((n) => (
        <div key={n._id}>
          <p>{n.message}</p>
        </div>
      ))}
    </div>
  );
};

export default Notifications;