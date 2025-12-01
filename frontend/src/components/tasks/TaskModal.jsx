import { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { createTask, updateTask, reset } from '../../redux/slices/taskSlice';

const TaskModal = ({ show, onHide, task, isEdit, employees }) => {
  const initialFormState = {
    title: '',
    description: '',
    assignedTo: '',
    dueDate: new Date().toISOString().split('T')[0],
    status: 'pending',
    priority: 'medium'
  };

  const [formData, setFormData] = useState(initialFormState);
  const [validated, setValidated] = useState(false);

  const dispatch = useDispatch();
  const { isLoading, isSuccess, isError } = useSelector((state) => state.tasks);

  const statuses = ['pending', 'in-progress', 'completed', 'cancelled'];
  const priorities = ['low', 'medium', 'high', 'urgent'];

  useEffect(() => {
    if (task && isEdit) {
      const formattedDate = task.dueDate 
        ? new Date(task.dueDate).toISOString().split('T')[0] 
        : new Date().toISOString().split('T')[0];

      setFormData({
        title: task.title || '',
        description: task.description || '',
        assignedTo: (task.assignedTo && typeof task.assignedTo === 'object') ? (task.assignedTo._id || '') : (task.assignedTo || ''),
        dueDate: formattedDate,
        status: task.status || 'pending',
        priority: task.priority || 'medium'
      });
    } else {
      setFormData(initialFormState);
    }
    setValidated(false);
  }, [task, isEdit, show]);

  useEffect(() => {
    if (isSuccess && !isLoading) {
      onHide();
      dispatch(reset());
    }
  }, [isSuccess, isLoading, onHide, dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }

    // Filter out empty values to avoid ObjectId casting errors
    const taskData = {
      ...formData,
      assignedTo: formData.assignedTo || undefined
    };

    if (isEdit) {
      dispatch(updateTask({ id: task._id, taskData }));
    } else {
      dispatch(createTask(taskData));
    }
  };

  return (
    <Modal show={show} onHide={onHide} backdrop="static" size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{isEdit ? 'Edit Task' : 'Add New Task'}</Modal.Title>
      </Modal.Header>

      <Form noValidate validated={validated} onSubmit={handleSubmit}>
        <Modal.Body>
          {isEdit === false && isLoading && (
            <Alert variant="info">Saving task...</Alert>
          )}
          {isEdit === false && !isLoading && isError && (
            <Alert variant="danger">Failed to save task. Please check required fields.</Alert>
          )}
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Title</Form.Label>
                <Form.Control 
                  type="text" 
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
                <Form.Control.Feedback type="invalid">
                  Please provide a title.
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Assignee</Form.Label>
                <Form.Select 
                  name="assignedTo"
                  value={formData.assignedTo}
                  onChange={handleChange}
                >
                  <option value="">Unassigned</option>
                  {employees && employees.map((assignee) => (
                    <option key={assignee._id} value={assignee._id}>
                      {assignee.name} ({assignee.type === 'user' ? assignee.role : 'Employee'})
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Due Date</Form.Label>
                <Form.Control 
                  type="date" 
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  required
                />
                <Form.Control.Feedback type="invalid">
                  Please provide a due date.
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Status</Form.Label>
                <Form.Select 
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                >
                  {statuses.map((s) => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Priority</Form.Label>
                <Form.Select 
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  required
                >
                  {priorities.map((p) => (
                    <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col>
              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control 
                  as="textarea" 
                  rows={4}
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                />
                <Form.Control.Feedback type="invalid">
                  Please provide a description.
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Spinner 
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                />
                <span className="ms-2">Saving...</span>
              </>
            ) : (
              isEdit ? 'Update' : 'Save'
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default TaskModal;


