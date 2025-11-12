// src/pages/Register.jsx
import { Row, Col, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import RegisterForm from '../components/auth/RegisterForm';

const Register = () => {
  return (
    <Row className="justify-content-center align-items-center" style={{ minHeight: "80vh" }}>
      <Col md={6} lg={5}>
        <Card className="shadow">
          <Card.Body className="p-4">
            <RegisterForm />
            <div className="text-center mt-3">
              <p>Already have an account? <Link to="/login">Login</Link></p>
            </div>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default Register;