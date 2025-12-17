import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import AddressAutocomplete from './AddressAutocomplete';

function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [homeAddress, setHomeAddress] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (isLogin) {
        await login(username, password);
      } else {
        if (!homeAddress) {
          setError('Home address is required');
          setLoading(false);
          return;
        }
        if (homeAddress.length < 10) {
          setError('Please enter a complete address');
          setLoading(false);
          return;
        }
        await register(username, password, homeAddress);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>Meetup Midpoint</h1>
        <h2>{isLogin ? 'Login' : 'Register'}</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label>Home Address</label>
              <AddressAutocomplete
                value={homeAddress}
                onChange={setHomeAddress}
                placeholder="Start typing your address..."
              />
              <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                Select from suggestions or type your full address
              </p>
            </div>
          )}

          {error && <p className="error">{error}</p>}

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? (isLogin ? 'Logging in...' : 'Validating address...') : (isLogin ? 'Login' : 'Register')}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px' }}>
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            style={{ background: 'none', border: 'none', color: '#3498db', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {isLogin ? 'Register' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
}

export default Auth;
