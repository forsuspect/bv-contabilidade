// BV Contabilidade - Premium Dashboard v1.1.0 (Black & Gray Edition)
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Companies from './pages/Companies';
import ObligationsCalendar from './pages/ObligationsCalendar';
import Users from './pages/Users';
import Documents from './pages/Documents';
import Payroll from './pages/Payroll';
import Profile from './pages/Profile';
import CostControl from './pages/CostControl';
import Layout from './components/Layout';
import LoadingScreen from './components/LoadingScreen';
import SafeToast from './components/SafeToast';

function App() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  const isExternal = user?.role === 'CLIENTE_EXTERNO';

  return (
    <Router>
      <SafeToast />
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to={isExternal ? "/cost-control" : "/"} />} />
        <Route path="/" element={user ? <Layout /> : <Navigate to="/login" />}>
          <Route index element={isExternal ? <Navigate to="/cost-control" /> : <Dashboard />} />
          <Route path="companies" element={isExternal ? <Navigate to="/cost-control" /> : <Companies />} />
          <Route path="calendar" element={isExternal ? <Navigate to="/cost-control" /> : <ObligationsCalendar />} />
          <Route path="users" element={isExternal ? <Navigate to="/cost-control" /> : <Users />} />
          <Route path="documents" element={isExternal ? <Navigate to="/cost-control" /> : <Documents />} />
          <Route path="payroll" element={isExternal ? <Navigate to="/cost-control" /> : <Payroll />} />
          <Route path="profile" element={<Profile />} />
          <Route path="cost-control" element={<CostControl />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
