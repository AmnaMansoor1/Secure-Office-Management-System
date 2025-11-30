import { Outlet } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import Header from './Header';
import Sidebar from './Sidebar';
import { useSelector, useDispatch } from 'react-redux';
import './MainLayout.css'; // Add this CSS file for custom styling
import { useEffect, useState } from 'react';
import authService from '../../services/authService';
import { login } from '../../redux/slices/authSlice';

const MainLayout = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });
  
  // Listen to custom event from Sidebar when collapsed changes
  useEffect(() => {
    const handler = (e) => {
      if (e?.detail?.collapsed !== undefined) {
        setSidebarCollapsed(!!e.detail.collapsed);
      }
    };
    window.addEventListener('sidebar:collapsed-change', handler);
    return () => window.removeEventListener('sidebar:collapsed-change', handler);
  }, []);

  // Apply body class for collapsed state (used by CSS to shift content)
  useEffect(() => {
    if (sidebarCollapsed) {
      document.body.classList.add('sidebar-collapsed');
    } else {
      document.body.classList.remove('sidebar-collapsed');
    }
  }, [sidebarCollapsed]);
  
  // Indicate presence of sidebar (only when logged in) for CSS margins
  useEffect(() => {
    if (user) {
      document.body.classList.add('has-sidebar');
    } else {
      document.body.classList.remove('has-sidebar');
      document.body.classList.remove('sidebar-collapsed');
    }
  }, [!!user]);
  
  // Refresh user profile to get latest permissions (e.g., files module)
  useEffect(() => {
    const refreshProfile = async () => {
      try {
        if (user && user.token) {
          const profile = await authService.getProfile();
          // Keep the existing token when updating profile
          const updated = { ...profile, token: user.token };
          dispatch(login(updated));
          localStorage.setItem('user', JSON.stringify(updated));
        }
      } catch (e) {
        // Silently ignore; ProtectedRoute and interceptors will handle auth state
        console.debug('Profile refresh skipped:', e?.message || e);
      }
    };
    refreshProfile();
    // Trigger after login or token changes
  }, [user?.token]);
  
  return (
    <div className="d-flex flex-column vh-100">
      <Header />
      <Container fluid className="flex-grow-1">
        <Row className="h-100">
          {user && (
            <Col md={3} lg={2} className="sidebar-col p-0">
              <Sidebar />
            </Col>
          )}
          <Col md={user ? 9 : 12} lg={user ? 10 : 12} className={`py-3 content-col`}>
            <Outlet />
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default MainLayout;