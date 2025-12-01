// src/pages/Meetings.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Container, Row, Col, Card, Table, Button, Form, Alert } from 'react-bootstrap';
import ConfirmModal from '../components/common/ConfirmModal';
import eventService from '../services/eventService';

const Meetings = () => {
  const { user } = useSelector((state) => state.auth);
  const canView = !!user?.permissions?.events?.view || user?.role === 'admin';
  const canCreate = !!user?.permissions?.events?.create || user?.role === 'admin' || user?.role === 'manager';
  const canDelete = !!user?.permissions?.events?.delete || user?.role === 'admin' || user?.role === 'manager';

  const [meetings, setMeetings] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [meetingToDelete, setMeetingToDelete] = useState(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    location: '',
    attendees: [],
    notifyByEmail: false
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      if (canView) {
        const list = await eventService.listMeetings();
        setMeetings(list);
      }
      if (canCreate) {
        const users = await eventService.getParticipants();
        setParticipants(users);
      }
    } catch (e) {
      setError(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  }, [canView, canCreate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleAttendeesChange = (e) => {
    const options = Array.from(e.target.selectedOptions);
    setForm(prev => ({ ...prev, attendees: options.map(o => o.value) }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.title || !form.startTime || !form.endTime) {
      setError('Title, start time and end time are required.');
      return;
    }
    try {
      setLoading(true);
      await eventService.createMeeting(form);
      setForm({ title: '', description: '', startTime: '', endTime: '', location: '', attendees: [], notifyByEmail: false });
      await fetchData();
    } catch (err) {
      setError(err?.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMeeting = (meeting) => {
    if (!canDelete) return;
    setMeetingToDelete(meeting);
    setShowConfirmModal(true);
  };

  const confirmDeleteMeeting = async () => {
    if (!meetingToDelete) return;
    try {
      setDeletingId(meetingToDelete._id);
      await eventService.deleteMeeting(meetingToDelete._id);
      await fetchData();
    } catch (err) {
      setError(err?.response?.data?.message || err.message);
    } finally {
      setDeletingId('');
      setShowConfirmModal(false);
      setMeetingToDelete(null);
    }
  };

  if (!canView) {
    return (
      <Container>
        <Alert variant="danger">You do not have permission to view meetings.</Alert>
      </Container>
    );
  }

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h1>Meetings</h1>
          </div>
        </Col>
      </Row>

      {error && (
        <Row>
          <Col>
            <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>
          </Col>
        </Row>
      )}

      {canCreate && (
        <Row className="mb-4">
          <Col md={8} lg={6}>
            <Card>
              <Card.Body>
                <Form onSubmit={handleCreate}>
                  <Form.Group className="mb-2">
                    <Form.Label>Title</Form.Label>
                    <Form.Control name="title" value={form.title} onChange={handleFormChange} />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>Description</Form.Label>
                    <Form.Control as="textarea" rows={3} name="description" value={form.description} onChange={handleFormChange} />
                  </Form.Group>
                  <Row>
                    <Col>
                      <Form.Group className="mb-2">
                        <Form.Label>Start</Form.Label>
                        <Form.Control type="datetime-local" name="startTime" value={form.startTime} onChange={handleFormChange} />
                      </Form.Group>
                    </Col>
                    <Col>
                      <Form.Group className="mb-2">
                        <Form.Label>End</Form.Label>
                        <Form.Control type="datetime-local" name="endTime" value={form.endTime} onChange={handleFormChange} />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Form.Group className="mb-2">
                    <Form.Label>Location</Form.Label>
                    <Form.Control name="location" value={form.location} onChange={handleFormChange} />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>Attendees</Form.Label>
                    <Form.Select multiple value={form.attendees} onChange={handleAttendeesChange}>
                      {participants.map(p => (
                        <option key={p._id} value={p._id}>{p.name} ({p.email})</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                  <Form.Check className="mb-2" type="checkbox" label="Send email invitations" name="notifyByEmail" checked={form.notifyByEmail} onChange={handleFormChange} />
                  <div className="mt-2">
                    <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Meeting'}</Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      <Row>
        <Col>
          <Card>
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Organizer</th>
                    <th>When</th>
                    <th>Location</th>
                    <th>Attendees</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {meetings.map(m => (
                    <tr key={m._id}>
                      <td>{m.title}</td>
                      <td>{m.organizer?.name || 'N/A'}</td>
                      <td>{new Date(m.startTime).toLocaleString()} — {new Date(m.endTime).toLocaleString()}</td>
                      <td>{m.location || '-'}</td>
                      <td>{Array.isArray(m.attendees) ? m.attendees.length : 0}</td>
                      <td>{m.status}</td>
                      <td className="text-nowrap" style={{ width: '120px' }}>
                        {canDelete && (
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={() => handleDeleteMeeting(m)}
                            disabled={deletingId === m._id}
                          >
                            <i className="bi bi-trash"></i>
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {meetings.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center text-muted">No meetings found.</td>
                    </tr>
                  )}
                </tbody>
              </Table>
              <ConfirmModal
                show={showConfirmModal}
                onHide={() => setShowConfirmModal(false)}
                onConfirm={confirmDeleteMeeting}
                title="Delete Meeting"
                message={`Are you sure you want to delete "${meetingToDelete?.title}"? This will also remove its notifications.`}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Meetings;
