import { useState } from 'react';
import { forgotPasswordRequest } from '../../api/auth-api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await forgotPasswordRequest(email);
    setSent(true);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Forgot password</h2>

      {sent ? (
        <p>Check your email for reset instructions.</p>
      ) : (
        <>
          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button type="submit">Send reset link</button>
        </>
      )}
    </form>
  );
};

export default ForgotPassword;