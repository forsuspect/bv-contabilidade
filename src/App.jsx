import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Companies from './pages/Companies';
import Users from './pages/Users';
import Documents from './pages/Documents';
import Payroll from './pages/Payroll';
import Profile from './pages/Profile';
import Layout from './components/Layout';
import LoadingScreen from './components/LoadingScreen';
import SafeToast from './components/SafeToast';

function App() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  return (
    <Router>
      <SafeToast />
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/" element={user ? <Layout /> : <Navigate to="/login" />}>
          <Route index element={<Dashboard />} />
          <Route path="companies" element={<Companies />} />
          <Route path="users" element={<Users />} />
          <Route path="documents" element={<Documents />} />
          <Route path="payroll" element={<Payroll />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
