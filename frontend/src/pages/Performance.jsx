import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Container, Row, Col, Card, Form, Button, Table, Alert, Badge } from 'react-bootstrap';
import performanceService from '../services/performanceService';
import employeeService from '../services/employeeService';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Performance = () => {
  const { user } = useSelector((state) => state.auth);
  const canView = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'employee' || !!user?.permissions?.performance?.view;
  const canCreate = !!user?.permissions?.performance?.create || user?.role === 'admin' || user?.role === 'manager';

  const [evaluations, setEvaluations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState({ evaluationId: '', employeeId: '' });
  const [form, setForm] = useState({ evaluationId: '', employeeId: '', ratingType: 'stars', ratingValue: 3, notes: '' });
  const [newEval, setNewEval] = useState({ periodStart: '', periodEnd: '' });

  const loadInitial = useCallback(async () => {
    try {
      setLoading(true);
      let evals = [];
      // Fetch evaluations only for roles with access
      if (user?.role === 'admin' || user?.role === 'manager' || !!user?.permissions?.performance?.view) {
        try {
          evals = await performanceService.listEvaluations();
          setEvaluations(evals);
          if (evals.length && !form.evaluationId) {
            setForm(prev => ({ ...prev, evaluationId: evals[0]._id }));
          }
        } catch (e) { setError(e?.response?.data?.message || e.message); }
      }
      // Fetch employees only if can create ratings
      if (canCreate) {
        try {
          const emps = await employeeService.getEmployees({ isActive: true });
          setEmployees(emps);
          if (emps.length && !form.employeeId) {
            setForm(prev => ({ ...prev, employeeId: emps[0]._id }));
          }
        } catch (e) { setError(e?.response?.data?.message || e.message); }
      }
      // Fetch ratings; employees see their own by default
      const employeeId = user?.employee?._id || user?.employee;
      const list = await performanceService.listRatings({
        employeeId: user?.role === 'employee' && employeeId ? employeeId : undefined
      });
      setRatings(list);
    } catch (e) {
      setError(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  }, [user, canCreate, form.employeeId, form.evaluationId]);

  useEffect(() => { loadInitial(); }, [loadInitial]);

  const handleCreateEvaluation = async (e) => {
    e.preventDefault();
    setError('');
    if (!newEval.periodStart || !newEval.periodEnd) {
      setError('Please select period start and end');
      return;
    }
    try {
      setLoading(true);
      const record = await performanceService.evaluatePeriod({ periodStart: newEval.periodStart, periodEnd: newEval.periodEnd });
      setEvaluations(prev => [record, ...prev]);
      setForm(prev => ({ ...prev, evaluationId: record._id }));
      setFilters(prev => ({ ...prev, evaluationId: record._id }));
    } catch (err) {
      setError(err?.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };
  const handleFilterChange = async (e) => {
    const { name, value } = e.target;
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    try {
      setLoading(true);
      const list = await performanceService.listRatings({
        evaluationId: newFilters.evaluationId || undefined,
        employeeId: newFilters.employeeId || undefined
      });
      setRatings(list);
    } catch (err) {
      setError(err?.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: name === 'ratingValue' ? Number(value) : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.evaluationId || !form.employeeId) {
      setError('Please select evaluation and employee');
      return;
    }
    if (form.ratingType === 'stars' && (form.ratingValue < 1 || form.ratingValue > 5)) {
      setError('Stars rating must be between 1 and 5');
      return;
    }
    if (form.ratingType === 'percentage' && (form.ratingValue < 0 || form.ratingValue > 100)) {
      setError('Percentage rating must be between 0 and 100');
      return;
    }
    try {
      setLoading(true);
      await performanceService.createRating(form);
      setForm({ evaluationId: '', employeeId: '', ratingType: form.ratingType, ratingValue: form.ratingType === 'stars' ? 3 : 50, notes: '' });
      const list = await performanceService.listRatings({
        evaluationId: filters.evaluationId || undefined,
        employeeId: filters.employeeId || undefined
      });
      setRatings(list);
    } catch (err) {
      setError(err?.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const chartData = useMemo(() => {
    const byEmployee = {};
    ratings.forEach(r => {
      const key = r.employee?.name || 'Unknown';
      if (!byEmployee[key]) byEmployee[key] = [];
      byEmployee[key].push(r.rating.ratingType === 'stars' ? r.rating.ratingValue * 20 : r.rating.ratingValue);
    });
    const labels = Object.keys(byEmployee);
    const averages = labels.map(k => {
      const arr = byEmployee[k];
      const avg = arr.reduce((a, b) => a + b, 0) / (arr.length || 1);
      return Math.round(avg);
    });
    return {
      labels,
      datasets: [
        { label: 'Avg Rating (%)', data: averages, backgroundColor: 'rgba(54, 162, 235, 0.6)' }
      ]
    };
  }, [ratings]);

  if (!canView) {
    return (
      <Container>
        <Alert variant="danger">You do not have permission to view performance.</Alert>
      </Container>
    );
  }

  return (
    <Container fluid>
      <Row className="mb-3">
        <Col><h1>Performance</h1></Col>
      </Row>

      {error && (
        <Row><Col><Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert></Col></Row>
      )}

      <Row className="mb-4">
        <Col md={6} lg={4}>
          <Card>
            <Card.Body>
              <h5 className="mb-3">Filter Ratings</h5>
              <Form>
                <Form.Group className="mb-2">
                  <Form.Label>Evaluation</Form.Label>
                  <Form.Select name="evaluationId" value={filters.evaluationId} onChange={handleFilterChange}>
                    <option value="">All</option>
                    {evaluations.map(ev => (
                      <option key={ev._id} value={ev._id}>{new Date(ev.periodStart).toLocaleDateString()} - {new Date(ev.periodEnd).toLocaleDateString()}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Label>Employee</Form.Label>
                  <Form.Select name="employeeId" value={filters.employeeId} onChange={handleFilterChange}>
                    <option value="">All</option>
                    {employees.map(emp => (
                      <option key={emp._id} value={emp._id}>{emp.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Form>
            </Card.Body>
          </Card>
        </Col>
        {canCreate && (
          <Col md={6} lg={8}>
            <Card className="mb-3">
              <Card.Body>
                <h5 className="mb-3">Create Evaluation Period</h5>
                <Form onSubmit={handleCreateEvaluation}>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-2">
                        <Form.Label>Start</Form.Label>
                        <Form.Control type="date" value={newEval.periodStart} onChange={(e) => setNewEval(prev => ({ ...prev, periodStart: e.target.value }))} />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-2">
                        <Form.Label>End</Form.Label>
                        <Form.Control type="date" value={newEval.periodEnd} onChange={(e) => setNewEval(prev => ({ ...prev, periodEnd: e.target.value }))} />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Evaluation'}</Button>
                </Form>
              </Card.Body>
            </Card>
            <Card>
              <Card.Body>
                <h5 className="mb-3">Add Rating</h5>
                <Form onSubmit={handleSubmit}>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-2">
                        <Form.Label>Evaluation</Form.Label>
                        <Form.Select name="evaluationId" value={form.evaluationId} onChange={handleFormChange}>
                          <option value="">Select</option>
                          {evaluations.map(ev => (
                            <option key={ev._id} value={ev._id}>{new Date(ev.periodStart).toLocaleDateString()} - {new Date(ev.periodEnd).toLocaleDateString()}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-2">
                        <Form.Label>Employee</Form.Label>
                        <Form.Select name="employeeId" value={form.employeeId} onChange={handleFormChange}>
                          <option value="">Select</option>
                          {employees.map(emp => (
                            <option key={emp._id} value={emp._id}>{emp.name}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-2">
                        <Form.Label>Rating Type</Form.Label>
                        <Form.Select name="ratingType" value={form.ratingType} onChange={handleFormChange}>
                          <option value="stars">Stars (1-5)</option>
                          <option value="percentage">Percentage (0-100)</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-2">
                        <Form.Label>Value</Form.Label>
                        <Form.Control type="number" name="ratingValue" value={form.ratingValue} onChange={handleFormChange} min={form.ratingType === 'stars' ? 1 : 0} max={form.ratingType === 'stars' ? 5 : 100} />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Form.Group className="mb-2">
                    <Form.Label>Notes</Form.Label>
                    <Form.Control as="textarea" rows={3} name="notes" value={form.notes} onChange={handleFormChange} />
                  </Form.Group>
                  <Button type="submit" disabled={loading}>{loading ? 'Submitting...' : 'Add Rating'}</Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        )}
      </Row>

      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Body>
              <h5 className="mb-3">Ratings</h5>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Evaluator</th>
                    <th>Type</th>
                    <th>Value</th>
                    <th>Rated At</th>
                    <th>Evaluation Period</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {ratings.map(r => (
                    <tr key={`${r.evaluationId}-${r.rating?.ratedAt}-${r.employee?._id || Math.random()}`}>
                      <td>{r.employee?.name || 'N/A'}</td>
                      <td>{r.evaluator?.name || 'N/A'}</td>
                      <td><Badge bg="info">{r.rating?.ratingType}</Badge></td>
                      <td>{r.rating?.ratingValue}</td>
                      <td>{r.rating?.ratedAt ? new Date(r.rating.ratedAt).toLocaleString() : '-'}</td>
                      <td>{new Date(r.periodStart).toLocaleDateString()} - {new Date(r.periodEnd).toLocaleDateString()}</td>
                      <td>{r.rating?.notes || ''}</td>
                    </tr>
                  ))}
                  {ratings.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center text-muted">No ratings found.</td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col>
          <Card>
            <Card.Body>
              <h5 className="mb-3">Average Ratings by Employee</h5>
              <Bar data={chartData} options={{ responsive: true, plugins: { legend: { position: 'top' }, title: { display: true, text: 'Average Rating (%)' } } }} />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Performance;
