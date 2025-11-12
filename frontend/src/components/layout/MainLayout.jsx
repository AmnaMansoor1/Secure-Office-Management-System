import { Outlet } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import Header from './Header';
import Sidebar from './Sidebar';
import { useSelector, useDispatch } from 'react-redux';
import './MainLayout.css'; // Add this CSS file for custom styling
import { useEffect } from 'react';
import authService from '../../services/authService';
import { login } from '../../redux/slices/authSlice';

const MainLayout = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  
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
            <Col md={3} lg={2} className="sidebar-col p-0 d-md-block">
              <Sidebar />
            </Col>
          )}
          <Col md={user ? 9 : 12} lg={user ? 10 : 12} className="py-3 content-col">
            <Outlet />
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default MainLayout;