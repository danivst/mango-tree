import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { resetPasswordRequest } from '../../api/auth-api';

const ResetPassword = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    await resetPasswordRequest(token, password);
    navigate('/login');
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Reset password</h2>

      <input
        type="password"
        placeholder="New password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button type="submit">Reset password</button>
    </form>
  );
};

export default ResetPassword;
