import { NavLink } from 'react-router-dom';
import { IMAGES } from '../constants/images';
import { useAuth } from '../auth';

export default function Navbar() {
  const { user, logout } = useAuth();
  return (
    <header className="site-header">
      <img src={IMAGES.banner} alt="Royal Rumble 2027" className="site-banner" />
      <nav>
        {user ? (
          <>
        <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>Home</NavLink>
        <NavLink to="/wrestlers" className={({ isActive }) => isActive ? 'active' : ''}>Wrestlers</NavLink>
        <NavLink to="/builder" className={({ isActive }) => isActive ? 'active' : ''}>Builder</NavLink>
        <NavLink to="/predictions" className={({ isActive }) => isActive ? 'active' : ''}>AI Predict</NavLink>
        <NavLink to="/simulate" className={({ isActive }) => isActive ? 'active' : ''}>Simulate</NavLink>
        <NavLink to="/results" className={({ isActive }) => isActive ? 'active' : ''}>Results</NavLink>
          </>
        ) : (
          <NavLink to="/login" className={({ isActive }) => isActive ? 'active' : ''}>Sign In</NavLink>
        )}
        {user && (
          <span className="nav-user">
            {user.email}
            <button type="button" className="link-btn" onClick={logout}>Sign out</button>
          </span>
        )}
      </nav>
    </header>
  );
}
