import { useState, useEffect } from 'react';
import { Badge, Dropdown, ListGroup } from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import { getNotifications, markAsRead } from '../../redux/slices/notificationSlice';

const NotificationBell = () => {
  const [show, setShow] = useState(false);
  const dispatch = useDispatch();
  const { notifications, unreadCount } = useSelector((state) => state.notifications);

  useEffect(() => {
    dispatch(getNotifications());
  }, [dispatch]);

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      dispatch(markAsRead(notification._id));
    }
    setShow(false);
  };

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <Dropdown show={show} onToggle={setShow}>
      <Dropdown.Toggle
        variant="link"
        className="text-decoration-none"
        style={{ border: 'none', background: 'none' }}
      >
        <i className="bi bi-bell fs-5 position-relative">
          {unreadCount > 0 && (
            <Badge
              bg="danger"
              className="position-absolute top-0 start-100 translate-middle rounded-pill"
              style={{ fontSize: '0.7rem' }}
            >
              {unreadCount}
            </Badge>
          )}
        </i>
      </Dropdown.Toggle>

      <Dropdown.Menu
        align="end"
        style={{ minWidth: '300px', maxHeight: '400px', overflowY: 'auto' }}
      >
        <Dropdown.Header>
          <div className="d-flex justify-content-between align-items-center">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <Badge bg="primary" className="ms-2">
                {unreadCount} new
              </Badge>
            )}
          </div>
        </Dropdown.Header>
        <Dropdown.Divider />

        {notifications.length === 0 ? (
          <Dropdown.ItemText className="text-center text-muted">
            No notifications
          </Dropdown.ItemText>
        ) : (
          notifications.slice(0, 10).map((notification) => (
            <Dropdown.Item
              key={notification._id}
              className={`p-2 ${!notification.isRead ? 'bg-light' : ''}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="d-flex align-items-start">
                <div className="flex-grow-1">
                  <div className="fw-bold">{notification.title}</div>
                  <div className="text-muted small">{notification.message}</div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                    {formatTime(notification.createdAt)}
                  </div>
                </div>
                {!notification.isRead && (
                  <div className="ms-2">
                    <div
                      className="bg-primary rounded-circle"
                      style={{ width: '8px', height: '8px' }}
                    />
                  </div>
                )}
              </div>
            </Dropdown.Item>
          ))
        )}

        {notifications.length > 10 && (
          <>
            <Dropdown.Divider />
            <Dropdown.ItemText className="text-center">
              <small className="text-muted">
                Showing 10 of {notifications.length} notifications
              </small>
            </Dropdown.ItemText>
          </>
        )}
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default NotificationBell;
