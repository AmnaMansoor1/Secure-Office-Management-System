// src/pages/Attendance.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAttendance, createAttendance, editAttendance, removeAttendance } from '../features/attendance/attendanceSlice';
import { Table, Button, Form, Row, Col, Spinner, Badge, Modal } from 'react-bootstrap';

const Attendance = () => {
  const dispatch = useDispatch();
  const { records, loading, error } = useSelector(state => state.attendance);
  // Get current user for permission checks
  const { user } = useSelector(state => state.auth);
  const [filters, setFilters] = useState({ status: '', date: '' });
  const [showMark, setShowMark] = useState(false);
  const [markData, setMarkData] = useState({ date: '', status: 'present', checkIn: '', checkOut: '', notes: '' });

  // Permission gating
  const canView = !!user?.permissions?.attendance?.view || user?.role === 'admin';
  const canCreate = !!user?.permissions?.attendance?.create || user?.role === 'admin';
  const canManage = !!user?.permissions?.attendance?.manage || user?.role === 'admin';
  const canDelete = !!user?.permissions?.attendance?.delete || user?.role === 'admin';

  useEffect(() => {
    if (!canView) return;
    const params = {
      status: filters.status || undefined
    };
    if (filters.date) {
      // Map single date filter to start/end for backend API
      params.startDate = filters.date;
      params.endDate = filters.date;
    }
    // Employees default to their own records
    if (user?.role === 'employee' && user?._id) {
      params.userId = user._id;
    }
    dispatch(getAttendance(params));
  }, [dispatch, filters, canView, user]);

  const handleMark = () => {
    if (!canCreate) return;
    dispatch(createAttendance(markData)).then(() => { setShowMark(false); setMarkData({ date: '', status: 'present', checkIn: '', checkOut: '', notes: '' }); });
  };

  const statusVariant = (s) => ({ present: 'success', absent: 'danger', remote: 'info', 'half-day': 'warning' }[s] || 'secondary');

  const shouldShowError = error && error !== 'You do not have permission to perform this action';

  if (!canView) {
    return (
      <div className="p-3">
        <h3>Attendance</h3>
        <div className="text-danger">You do not have permission to view attendance.</div>
      </div>
    );
  }

  return (
    <div className="p-3">
      <h3>Attendance</h3>
      <Row className="mb-3">
        <Col md={3}>
          <Form.Control type="date" value={filters.date} onChange={(e) => setFilters({ ...filters, date: e.target.value })} />
        </Col>
        <Col md={3}>
          <Form.Select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="">All Status</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="remote">Remote</option>
            <option value="half-day">Half Day</option>
          </Form.Select>
        </Col>
        <Col md="auto">
          {canCreate && (
            <Button onClick={() => setShowMark(true)}>Mark Attendance</Button>
          )}
        </Col>
      </Row>

      {loading && <Spinner animation="border" />} {shouldShowError && <div className="text-danger">{error}</div>}

      <Table striped bordered hover>
        <thead>
          <tr>
            <th>User</th>
            <th>Date</th>
            <th>Status</th>
            <th>Check-In</th>
            <th>Check-Out</th>
            <th>Notes</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r) => (
            <tr key={r._id}>
              <td>{r.user?.name || r.employee?.name || '-'} ({r.user?.email || '-'})</td>
              <td>{new Date(r.date).toLocaleDateString()}</td>
              <td><Badge bg={statusVariant(r.status)}>{r.status}</Badge></td>
              <td>{r.checkIn || '-'}</td>
              <td>{r.checkOut || '-'}</td>
              <td>{r.notes || '-'}</td>
              <td>
                {canManage && (
                  <Button size="sm" variant="outline-primary" onClick={() => dispatch(editAttendance({ id: r._id, payload: { status: r.status === 'present' ? 'absent' : 'present' } }))}>Toggle</Button>
                )}{' '}
                {canDelete && (
                  <Button size="sm" variant="outline-danger" onClick={() => dispatch(removeAttendance(r._id))}>Delete</Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal show={showMark} onHide={() => setShowMark(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Mark Attendance</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-2">
              <Form.Label>Date</Form.Label>
              <Form.Control type="date" value={markData.date} onChange={(e) => setMarkData({ ...markData, date: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Status</Form.Label>
              <Form.Select value={markData.status} onChange={(e) => setMarkData({ ...markData, status: e.target.value })}>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="remote">Remote</option>
                <option value="half-day">Half Day</option>
              </Form.Select>
            </Form.Group>
            <Row>
              <Col>
                <Form.Group className="mb-2">
                  <Form.Label>Check-In</Form.Label>
                  <Form.Control type="time" value={markData.checkIn} onChange={(e) => setMarkData({ ...markData, checkIn: e.target.value })} />
                </Form.Group>
              </Col>
              <Col>
                <Form.Group className="mb-2">
                  <Form.Label>Check-Out</Form.Label>
                  <Form.Control type="time" value={markData.checkOut} onChange={(e) => setMarkData({ ...markData, checkOut: e.target.value })} />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-2">
              <Form.Label>Notes</Form.Label>
              <Form.Control as="textarea" rows={3} value={markData.notes} onChange={(e) => setMarkData({ ...markData, notes: e.target.value })} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowMark(false)}>Cancel</Button>
          {canCreate && <Button onClick={handleMark}>Save</Button>}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Attendance;
