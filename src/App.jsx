import { useState } from 'react';
import LoginRegister from './components/LoginRegister';
import HomePage from './components/HomePage';

function App() {
  const [currentUser, setCurrentUser] = useState(null);

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleUserUpdate = (updatedUser) => {
    setCurrentUser(updatedUser);
  };

  // Show login/register if not logged in
  if (!currentUser) {
    return <LoginRegister onLogin={setCurrentUser} />;
  }

  // Show home page after login
  return <HomePage user={currentUser} onLogout={handleLogout} onUserUpdate={handleUserUpdate} />;
}

export default App;


