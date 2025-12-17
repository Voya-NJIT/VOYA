import { useState } from 'react';
import axios from 'axios';
import AddressAutocomplete from './AddressAutocomplete';

function LoginRegister({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // Login
        const res = await axios.post('/api/auth/login', { name, password });
        onLogin(res.data);
      } else {
        // Register
        if (!address) {
          setError('Address is required');
          setLoading(false);
          return;
        }
        const res = await axios.post('/api/users', { name, address, password });
        if (res.data.error) {
          setError(res.data.error);
        } else {
          onLogin(res.data);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>Voya</h1>
        <h2>{isLogin ? 'Login' : 'Register'}</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              required
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label>Address</label>
              <AddressAutocomplete
                value={address}
                onChange={setAddress}
                placeholder="Start typing your address..."
              />
            </div>
          )}

          {error && <p className="error">{error}</p>}

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? (isLogin ? 'Logging in...' : 'Registering...') : (isLogin ? 'Login' : 'Register')}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px' }}>
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#3498db',
              cursor: 'pointer',
              textDecoration: 'underline',
              fontSize: '14px'
            }}
          >
            {isLogin ? 'Register' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
}

export default LoginRegister;
