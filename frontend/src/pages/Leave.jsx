// src/pages/Leave.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getLeaveRequests, createLeaveRequest, manageLeaveRequest, removeLeaveRequest } from '../features/leave/leaveSlice';
import { Table, Button, Form, Row, Col, Spinner, Badge, Modal } from 'react-bootstrap';
import { useSelector as useAuthSelector } from 'react-redux';

const Leave = () => {
  const dispatch = useDispatch();
  const { requests, loading, error } = useSelector(state => state.leave);
  const authState = useAuthSelector(state => state.auth);
  const role = authState?.user?.role;

  const [filters, setFilters] = useState({ status: '' });
  const [showApply, setShowApply] = useState(false);
  const [applyData, setApplyData] = useState({ type: 'annual', startDate: '', endDate: '', reason: '' });

  useEffect(() => {
    dispatch(getLeaveRequests({ status: filters.status || undefined }));
  }, [dispatch, filters]);

  const handleApply = () => {
    dispatch(createLeaveRequest(applyData)).then(() => { setShowApply(false); setApplyData({ type: 'annual', startDate: '', endDate: '', reason: '' }); });
  };

  const statusVariant = (s) => ({ approved: 'success', pending: 'warning', rejected: 'danger' }[s] || 'secondary');

  return (
    <div className="p-3">
      <h3>Leave Management</h3>
      <Row className="mb-3">
        <Col md={3}>
          <Form.Select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </Form.Select>
        </Col>
        <Col md="auto">
          <Button onClick={() => setShowApply(true)}>Apply Leave</Button>
        </Col>
      </Row>

      {loading && <Spinner animation="border" />} {error && <div className="text-danger">{error}</div>}

      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Employee</th>
            <th>Type</th>
            <th>Period</th>
            <th>Status</th>
            <th>Approver</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((r) => (
            <tr key={r._id}>
              <td>{r.user?.name || '-'}</td>
              <td>{r.type}</td>
              <td>{new Date(r.startDate).toLocaleDateString()} - {new Date(r.endDate).toLocaleDateString()}</td>
              <td><Badge bg={statusVariant(r.status)}>{r.status}</Badge></td>
              <td>{r.approver?.name || '-'}</td>
              <td>
                {(role === 'admin' || role === 'manager') && r.status === 'pending' && (
                  <>
                    <Button size="sm" variant="outline-success" onClick={() => dispatch(manageLeaveRequest({ id: r._id, action: 'approve' }))}>Approve</Button>{' '}
                    <Button size="sm" variant="outline-danger" onClick={() => dispatch(manageLeaveRequest({ id: r._id, action: 'reject' }))}>Reject</Button>{' '}
                  </>
                )}
                <Button size="sm" variant="outline-danger" onClick={() => dispatch(removeLeaveRequest(r._id))}>Delete</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal show={showApply} onHide={() => setShowApply(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Apply Leave</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-2">
              <Form.Label>Type</Form.Label>
              <Form.Select value={applyData.type} onChange={(e) => setApplyData({ ...applyData, type: e.target.value })}>
                <option value="annual">Annual</option>
                <option value="sick">Sick</option>
                <option value="casual">Casual</option>
                <option value="unpaid">Unpaid</option>
                <option value="other">Other</option>
              </Form.Select>
            </Form.Group>
            <Row>
              <Col>
                <Form.Group className="mb-2">
                  <Form.Label>Start Date</Form.Label>
                  <Form.Control type="date" value={applyData.startDate} onChange={(e) => setApplyData({ ...applyData, startDate: e.target.value })} />
                </Form.Group>
              </Col>
              <Col>
                <Form.Group className="mb-2">
                  <Form.Label>End Date</Form.Label>
                  <Form.Control type="date" value={applyData.endDate} onChange={(e) => setApplyData({ ...applyData, endDate: e.target.value })} />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-2">
              <Form.Label>Reason</Form.Label>
              <Form.Control as="textarea" rows={3} value={applyData.reason} onChange={(e) => setApplyData({ ...applyData, reason: e.target.value })} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowApply(false)}>Cancel</Button>
          <Button onClick={handleApply}>Submit</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Leave;