import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Wrestlers from './pages/Wrestlers';
import Builder from './pages/Builder';
import Simulate from './pages/Simulate';
import Results from './pages/Results';
import Predictions from './pages/Predictions';
import Login from './pages/Login';
import { useAuth } from './auth';

// Pages that need an account. Signed-out visitors are sent to the sign-in page.
function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <p style={{ textAlign: 'center' }}>Loading...</p>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<RequireAuth><Home /></RequireAuth>} />
        <Route path="/wrestlers" element={<RequireAuth><Wrestlers /></RequireAuth>} />
        <Route path="/builder" element={<RequireAuth><Builder /></RequireAuth>} />
        <Route path="/simulate" element={<RequireAuth><Simulate /></RequireAuth>} />
        <Route path="/results" element={<RequireAuth><Results /></RequireAuth>} />
        <Route path="/predictions" element={<RequireAuth><Predictions /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <footer>
        <p>Rumble Atlas by Matchday Atlas - AI Powered MERN Stack | Fan Project | Not affiliated with WWE</p>
      </footer>
    </>
  );
}
