import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const res = await axios.get('/api/auth/me');
      setUser(res.data);
    } catch (error) {
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    const res = await axios.post('/api/auth/login', { username, password });
    localStorage.setItem('token', res.data.token);
    setToken(res.data.token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
    // Fetch full user data after login
    const userRes = await axios.get('/api/auth/me');
    setUser(userRes.data);
    return res.data;
  };

  const register = async (username, password, homeAddress) => {
    const res = await axios.post('/api/auth/register', { username, password, homeAddress });
    localStorage.setItem('token', res.data.token);
    setToken(res.data.token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
    setUser({ 
      id: res.data.userId, 
      username: res.data.username,
      home_address: res.data.homeAddress 
    });
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
