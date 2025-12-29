import { useEffect, useState } from 'react';
import { fetchUsers } from '../../api/admin-api';

const Users = () => {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    fetchUsers().then(setUsers);
  }, []);

  return (
    <div>
      <h2>Users</h2>
      {users.map((u) => (
        <div key={u._id}>
          {u.username} — {u.role}
        </div>
      ))}
    </div>
  );
};

export default Users;