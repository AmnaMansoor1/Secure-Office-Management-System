import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Spinner, Alert, Form, Badge } from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import { getTasks, deleteTask, reset } from '../redux/slices/taskSlice';
import { getEmployees } from '../redux/slices/employeeSlice';
import { getUsers } from '../redux/slices/authSlice';
import TaskModal from '../components/tasks/TaskModal';
import ConfirmModal from '../components/common/ConfirmModal';

const Tasks = () => {
  const [showModal, setShowModal] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');

  const dispatch = useDispatch();
  const { tasks, isLoading, isError, isSuccess, message } = useSelector((state) => state.tasks);
  const { employees } = useSelector((state) => state.employees);
  const { users } = useSelector((state) => state.auth);
  const { user } = useSelector((state) => state.auth);

  const canCreate = user?.permissions?.tasks?.create;
  const canUpdate = user?.permissions?.tasks?.update;
  const canDelete = user?.permissions?.tasks?.delete;
  const canView = user?.role === 'admin' || user?.permissions?.tasks?.view;

  useEffect(() => {
    dispatch(getTasks());
    dispatch(getEmployees());
    dispatch(getUsers());
    return () => {
      dispatch(reset());
    };
  }, [dispatch]);

  useEffect(() => {
    if (isSuccess) {
      closeModal();
    }
  }, [isSuccess]);

  const handleAdd = () => {
    setCurrentTask(null);
    setShowModal(true);
  };

  const handleEdit = (task) => {
    setCurrentTask(task);
    setShowModal(true);
  };

  const handleDelete = (task) => {
    setTaskToDelete(task);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!taskToDelete) return;
    dispatch(deleteTask(taskToDelete._id));
    setShowConfirmModal(false);
    setTaskToDelete(null);
  };

  const closeModal = () => {
    setShowModal(false);
    setCurrentTask(null);
  };

  const getEmployeeName = (task) => {
    // If assignedTo is already populated (object), use it directly
    if (task.assignedTo && typeof task.assignedTo === 'object' && task.assignedTo.name) {
      return task.assignedTo.name;
    }
    
    // If assignedTo is just an ID, try to find in users/employees arrays
    if (task.assignedTo) {
      const user = users.find(u => u._id === task.assignedTo);
      if (user) return user.name;
      
      const employee = employees.find(emp => emp._id === task.assignedTo);
      if (employee) return employee.name;
    }
    
    return 'Unassigned';
  };

  const filteredTasks = tasks.filter(task => {
    const matchesStatus = !filterStatus || task.status === filterStatus;
    const matchesPriority = !filterPriority || task.priority === filterPriority;
    const matchesAssignee = !filterAssignee || task.assignedTo === filterAssignee;
    return matchesStatus && matchesPriority && matchesAssignee;
  });

  const statuses = ['pending', 'in-progress', 'completed', 'cancelled'];
  const priorities = ['low', 'medium', 'high', 'urgent'];
  
  // Combine users and employees for assignment
  const allAssignees = [
    ...users.map(user => ({ ...user, type: 'user' })),
    ...employees.map(emp => ({ ...emp, type: 'employee' }))
  ];

  if (!canView) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
        <h2>No Access</h2>
        <p className="text-muted mb-3">You do not have permission to view this page.</p>
        <a href="/profile" className="btn btn-primary">Go to My Profile</a>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h1>Tasks</h1>
            {canCreate && (
              <Button variant="primary" onClick={handleAdd}>
                <i className="bi bi-plus-circle me-2"></i>Add Task
              </Button>
            )}
          </div>
        </Col>
      </Row>

      {isError && (
        <Row>
          <Col>
            <Alert variant="danger">{message}</Alert>
          </Col>
        </Row>
      )}

      <Row className="mb-4">
        <Col md={12}>
          <Card className="bg-light">
            <Card.Body>
              <Row>
                <Col md={4} className="mb-3 mb-md-0">
                  <Form.Group>
                    <Form.Label>Status</Form.Label>
                    <Form.Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                      <option value="">All</option>
                      {statuses.map(s => (
                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4} className="mb-3 mb-md-0">
                  <Form.Group>
                    <Form.Label>Priority</Form.Label>
                    <Form.Select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
                      <option value="">All</option>
                      {priorities.map(p => (
                        <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Assignee</Form.Label>
                    <Form.Select value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)}>
                      <option value="">All</option>
                      {allAssignees.map(assignee => (
                        <option key={assignee._id} value={assignee._id}>
                          {assignee.name} ({assignee.type === 'user' ? assignee.role : 'Employee'})
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col>
          <Card>
            <Card.Header className="bg-info text-white">
              <h5 className="mb-0">Task List</h5>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <Table hover>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Assignee</th>
                      <th>Due Date</th>
                      <th>Status</th>
                      <th>Priority</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks.length > 0 ? (
                      filteredTasks.map((task) => (
                        <tr key={task._id}>
                          <td>{task.title}</td>
                          <td>{getEmployeeName(task)}</td>
                          <td>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}</td>
                          <td>
                            <Badge bg={
                              task.status === 'completed' ? 'success' :
                              task.status === 'in-progress' ? 'primary' :
                              task.status === 'cancelled' ? 'danger' : 'secondary'
                            }>
                              {task.status.charAt(0).toUpperCase() + task.status.slice(1).replace('-', ' ')}
                            </Badge>
                          </td>
                          <td>
                            <Badge bg={
                              task.priority === 'urgent' ? 'danger' :
                              task.priority === 'high' ? 'warning' :
                              task.priority === 'medium' ? 'info' : 'secondary'
                            }>
                              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                            </Badge>
                          </td>
                          <td>
                            <div className="d-flex gap-2">
                              {canUpdate && (
                                <Button 
                                  variant="outline-primary" 
                                  size="sm"
                                  onClick={() => handleEdit(task)}
                                >
                                  <i className="bi bi-pencil"></i>
                                </Button>
                              )}
                              {canDelete && (
                                <Button 
                                  variant="outline-danger" 
                                  size="sm"
                                  onClick={() => handleDelete(task)}
                                >
                                  <i className="bi bi-trash"></i>
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center">No tasks found</td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <TaskModal
        show={showModal}
        onHide={closeModal}
        task={currentTask}
        isEdit={!!currentTask}
        employees={allAssignees}
      />

      <ConfirmModal
        show={showConfirmModal}
        onHide={() => setShowConfirmModal(false)}
        onConfirm={confirmDelete}
        title="Delete Task"
        message={`Are you sure you want to delete "${taskToDelete?.title}"? This action cannot be undone.`}
      />
    </Container>
  );
};

export default Tasks;


