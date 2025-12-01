// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { Row, Col, Card, Alert } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import api from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useSelector((state) => state.auth);
  
  // Check for analytics or dashboard permission
  const canViewDashboard = user?.permissions?.analytics?.view || user?.role === 'admin';

  // Always call hooks before any conditional returns
  
  useEffect(() => {
    // Avoid fetching dashboard data if user has no permission
    if (!canViewDashboard) {
      setLoading(false);
      setError(null);
      return;
    }

    const fetchDashboardData = async () => {
      try {
        const response = await api.get('/analytics/dashboard');
        setDashboardData(response.data);
        setLoading(false);
      } catch (error) {
        const message = error?.response?.data?.message || error.message || 'Failed to fetch dashboard data';
        setError(message);
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [canViewDashboard]);
  
  if (!canViewDashboard) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
        <svg width="120" height="120" fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" style={{ marginBottom: 24 }}>
          <circle cx="60" cy="60" r="60" fill="#f5f7fb"/>
          <path d="M40 80h40M60 40v20" stroke="#4568dc" strokeWidth="4" strokeLinecap="round"/>
          <circle cx="60" cy="35" r="5" fill="#4568dc"/>
        </svg>
        <h2>Welcome, {user?.name || 'User'}!</h2>
        <p className="text-muted mb-3" style={{ maxWidth: 340, textAlign: 'center' }}>
          You do not have access to the admin dashboard.<br />
          Please use the menu to access your available features.
        </p>
        <a href="/profile" className="btn btn-primary">Go to My Profile</a>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center my-5"><h3>Loading dashboard data...</h3></div>;
  }
  
  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }
  
  return (
    <div className="dashboard">
      <h1 className="mb-4">Dashboard</h1>
      
      <div className="dashboard-cards-row">
        <div className="dashboard-card bg-primary">
          <div className="card-content">
            <div className="card-title">Employees</div>
            <div className="card-value">{dashboardData?.counts?.employees || 0}</div>
          </div>
          <span className="card-icon bi bi-people"></span>
        </div>
        <div className="dashboard-card bg-success">
          <div className="card-content">
            <div className="card-title">Assets</div>
            <div className="card-value">{dashboardData?.counts?.assets || 0}</div>
          </div>
          <span className="card-icon bi bi-briefcase"></span>
        </div>
        <div className="dashboard-card bg-warning">
          <div className="card-content">
            <div className="card-title">Monthly Income</div>
            <div className="card-value">PKR{dashboardData?.financialSummary?.currentMonth?.income.toLocaleString() || 0}</div>
          </div>
          <span className="card-icon bi bi-wallet2"></span>
        </div>
        <div className="dashboard-card bg-danger">
          <div className="card-content">
            <div className="card-title">Monthly Expenses</div>
            <div className="card-value">PKR{dashboardData?.financialSummary?.currentMonth?.expenses.toLocaleString() || 0}</div>
          </div>
          <span className="card-icon bi bi-cash-stack"></span>
        </div>
      </div>
      
      <Row>
        <Col md={8}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Recent Activity</h5>
            </Card.Header>
            <Card.Body>
              {dashboardData?.recentActivity?.expenses?.length > 0 ? (
                <div>
                  <h6>Recent Expenses</h6>
                  <ul className="list-group mb-3">
                    {dashboardData.recentActivity.expenses.map((expense) => (
                      <li key={expense._id} className="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                          <strong>{expense.title}</strong> - {expense.category}
                          <div className="text-muted small">{new Date(expense.date).toLocaleDateString()}</div>
                        </div>
                        <span className="badge bg-danger rounded-pill">PKR{expense.amount.toLocaleString()}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p>No recent expenses</p>
              )}
              
              {dashboardData?.recentActivity?.income?.length > 0 ? (
                <div>
                  <h6>Recent Income</h6>
                  <ul className="list-group">
                    {dashboardData.recentActivity.income.map((income) => (
                      <li key={income._id} className="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                          <strong>{income.title}</strong> - {income.category}
                          <div className="text-muted small">{new Date(income.date).toLocaleDateString()}</div>
                        </div>
                        <span className="badge bg-success rounded-pill">PKR{income.amount.toLocaleString()}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p>No recent income</p>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Financial Summary</h5>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <h6>Current Month: {new Date().toLocaleString('default', { month: 'long' })} {new Date().getFullYear()}</h6>
              </div>
              
              <div className="d-flex justify-content-between mb-2">
                <span>Income:</span>
                <strong className="text-success">PKR{dashboardData?.financialSummary?.currentMonth?.income.toLocaleString() || 0}</strong>
              </div>
              
              <div className="d-flex justify-content-between mb-2">
                <span>Expenses:</span>
                <strong className="text-danger">PKR{dashboardData?.financialSummary?.currentMonth?.expenses.toLocaleString() || 0}</strong>
              </div>
              
              <div className="d-flex justify-content-between mb-2">
                <span>Profit:</span>
                <strong className={dashboardData?.financialSummary?.currentMonth?.profit >= 0 ? "text-success" : "text-danger"}>
                  PKR{dashboardData?.financialSummary?.currentMonth?.profit.toLocaleString() || 0}
                </strong>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
