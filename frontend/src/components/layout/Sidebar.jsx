import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import './Sidebar.css';
import logo from '../../assets/logo.png';

const Sidebar = () => {
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const [collapsed, setCollapsed] = useState(() => {
    const v = localStorage.getItem('sidebarCollapsed');
    return v === 'true';
  });
  const [dragging, setDragging] = useState(false);
  const startXRef = useRef(null);

  // Helper function to check permissions
  const hasPermission = (module, action) => {
    if (!user || !user.permissions) return false;
    return user.permissions[module]?.[action];
  };
  
  // Define sidebar sections
  const sections = [
    {
      heading: 'Main',
      items: [
        {
          name: 'Dashboard',
          path: '/dashboard',
          icon: 'bi bi-speedometer2',
          iconClass: 'dashboard',
          permission: null // Everyone can access
        },
        {
          name: 'Employees',
          path: '/employees',
          icon: 'bi bi-people',
          iconClass: 'employees',
          permission: { module: 'employees', action: 'view' }
        },
        {
          name: 'Assets',
          path: '/assets',
          icon: 'bi bi-briefcase',
          iconClass: 'assets',
          permission: { module: 'assets', action: 'view' }
        },
        {
          name: 'Files',
          path: '/files',
          icon: 'bi bi-folder2',
          iconClass: 'files',
          permission: null
        },
        {
          name: 'Attendance & Leave',
          path: '/attendance',
          icon: 'bi bi-calendar-event',
          iconClass: 'attendance-leave',
          permission: null
        },
        {
          name: 'Performance',
          path: '/performance',
          icon: 'bi bi-award',
          iconClass: 'performance',
          permission: null
        },
        {
          name: 'Meetings',
          path: '/meetings',
          icon: 'bi bi-people',
          iconClass: 'meetings',
          permission: null
        },
        // Removed separate Leave item; unified under 'Attendance & Leave'
      ]
    },
    {
      heading: 'Finance',
      items: [
        {
          name: 'Tasks',
          path: '/tasks',
          icon: 'bi bi-list-check',
          iconClass: 'tasks',
          permission: { module: 'tasks', action: 'view' }
        },
        {
          name: 'Expenses',
          path: '/expenses',
          icon: 'bi bi-cash-stack',
          iconClass: 'expenses',
          permission: { module: 'expenses', action: 'view' }
        },
        {
          name: 'Income',
          path: '/income',
          icon: 'bi bi-wallet2',
          iconClass: 'income',
          permission: { module: 'income', action: 'view' }
        },
        {
          name: 'Analytics',
          path: '/analytics',
          icon: 'bi bi-graph-up',
          iconClass: 'analytics',
          permission: { module: 'analytics', action: 'view' }
        }
      ]
    },
    {
      heading: 'Account',
      items: [
        {
          name: 'Profile',
          path: '/profile',
          icon: 'bi bi-person-circle',
          iconClass: 'profile',
          permission: null // Everyone can access their profile
        },
        {
          name: 'User Management',
          path: '/users',
          icon: 'bi bi-people-fill',
          iconClass: 'users',
          permission: { role: 'admin' } // Only admins
        }
      ]
    }
  ];
  
  const isActive = (path) => location.pathname === path;

  // Drag handlers
  const onMouseDown = (e) => {
    setDragging(true);
    startXRef.current = e.clientX;
    document.body.style.userSelect = 'none';
  };

  const onMouseMove = (e) => {
    if (!dragging || startXRef.current == null) return;
    const delta = e.clientX - startXRef.current;
    // If dragging left by > 60px, collapse; if dragging right by > 60px, expand
    if (delta < -60) {
      if (!collapsed) {
        setCollapsed(true);
        localStorage.setItem('sidebarCollapsed', 'true');
        window.dispatchEvent(new CustomEvent('sidebar:collapsed-change', { detail: { collapsed: true } }));
      }
    } else if (delta > 60) {
      if (collapsed) {
        setCollapsed(false);
        localStorage.setItem('sidebarCollapsed', 'false');
        window.dispatchEvent(new CustomEvent('sidebar:collapsed-change', { detail: { collapsed: false } }));
      }
    }
  };

  const onMouseUp = () => {
    setDragging(false);
    startXRef.current = null;
    document.body.style.userSelect = '';
  };

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    } else {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [dragging]);

  // Notify layout whenever collapsed changes
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('sidebar:collapsed-change', { detail: { collapsed } })
    );
  }, [collapsed]);

  // Dispatch initial state on mount
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('sidebar:collapsed-change', { detail: { collapsed } })
    );
  }, []);

  // Listen for explicit set-collapsed requests (from Header toggle)
  useEffect(() => {
    const handler = (e) => {
      if (e?.detail?.collapsed !== undefined) {
        const next = !!e.detail.collapsed;
        setCollapsed(next);
        localStorage.setItem('sidebarCollapsed', next ? 'true' : 'false');
        window.dispatchEvent(new CustomEvent('sidebar:collapsed-change', { detail: { collapsed: next } }));
      }
    };
    window.addEventListener('sidebar:set-collapsed', handler);
    return () => window.removeEventListener('sidebar:set-collapsed', handler);
  }, []);

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''} ${dragging ? 'dragging' : ''}`}>
      <div className="logo mb-4" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img src={logo} alt="Logo" style={{ height: 40, marginRight: 8 }} />
        <span style={{
          fontWeight: 700,
          fontSize: 16,
          background: 'linear-gradient(90deg, #4568dc 0%, #43cea2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          textFillColor: 'transparent',
          letterSpacing: 0.5,
          fontFamily: 'Segoe UI, Roboto, Arial, sans-serif',
          lineHeight: 1.1,
          paddingTop: 2,
          marginTop: 0 /* remove extra top spacing */
        }}>
          Office Manager
        </span>
      </div>
      {/* Resizer handle */}
      <div className="sidebar-resizer" onMouseDown={onMouseDown} />
      
      {sections.map((section, sIndex) => (
        <div className="sidebar-section" key={`section-${sIndex}`}>
          <div className="sidebar-heading">{section.heading}</div>
          
          <ul className="sidebar-nav">
            {section.items.map((item, iIndex) => {
              // Check permissions
              if (item.permission) {
                if (item.permission.role && user?.role !== item.permission.role) {
                  return null;
                }
                
                if (item.permission.module && 
                    !hasPermission(item.permission.module, item.permission.action)) {
                  return null;
                }
              }
              
              return (
                <li className="sidebar-nav-item" key={`item-${sIndex}-${iIndex}`}>
                  <Link
                    to={item.path}
                    className={`sidebar-nav-link ${isActive(item.path) ? 'active' : ''}`}
                  >
                    <i className={`${item.icon} sidebar-nav-icon ${item.iconClass}`}></i>
                    <span>{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default Sidebar;