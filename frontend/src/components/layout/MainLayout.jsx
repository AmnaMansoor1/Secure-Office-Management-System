import { Outlet } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import Header from './Header';
import Sidebar from './Sidebar';
import { useSelector } from 'react-redux';
import './MainLayout.css'; // Add this CSS file for custom styling

const MainLayout = () => {
  const { user } = useSelector((state) => state.auth);
  
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