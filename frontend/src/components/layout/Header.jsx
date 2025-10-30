import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';
import NotificationBell from '../common/NotificationBell';
import logo from '../../assets/logo.png';
import './Header.css';

const Header = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  
  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };
  
  const closeDropdown = () => {
    setDropdownOpen(false);
  };
  
  const onLogout = () => {
    dispatch(logout());
    navigate('/login');
  };
  
  // Function to get user initials
  const getUserInitials = () => {
    if (!user || !user.name) return 'U';
    
    const names = user.name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };
  
  const isActive = (path) => {
    return location.pathname === path;
  };
  
  return (
    <div className="header">
      <div className="header-brand">
        <span>Office Management System</span>
      </div>
      
      {user && (
        <div className="header-navbar">
          <ul className="header-nav">
            <li className="header-nav-item">
              <Link 
                to="/dashboard" 
                className={`header-nav-link ${isActive('/dashboard') ? 'active' : ''}`}
              >
                Dashboard
              </Link>
            </li>
            
            {user.permissions?.employees?.view && (
              <li className="header-nav-item">
                <Link 
                  to="/employees" 
                  className={`header-nav-link ${isActive('/employees') ? 'active' : ''}`}
                >
                  Employees
                </Link>
              </li>
            )}
            
            {user.permissions?.assets?.view && (
              <li className="header-nav-item">
                <Link 
                  to="/assets" 
                  className={`header-nav-link ${isActive('/assets') ? 'active' : ''}`}
                >
                  Assets
                </Link>
              </li>
            )}
            
            {user.permissions?.expenses?.view && (
              <li className="header-nav-item">
                <Link 
                  to="/expenses" 
                  className={`header-nav-link ${isActive('/expenses') ? 'active' : ''}`}
                >
                  Expenses
                </Link>
              </li>
            )}
            
            {user.permissions?.income?.view && (
              <li className="header-nav-item">
                <Link 
                  to="/income" 
                  className={`header-nav-link ${isActive('/income') ? 'active' : ''}`}
                >
                  Income
                </Link>
              </li>
            )}
            
            {user.permissions?.analytics?.view && (
              <li className="header-nav-item">
                <Link 
                  to="/analytics" 
                  className={`header-nav-link ${isActive('/analytics') ? 'active' : ''}`}
                >
                  Analytics
                </Link>
              </li>
            )}
          </ul>
          
          <div className="header-actions">
            <NotificationBell />
            
            <div className="user-dropdown">
              <button 
                className="user-dropdown-toggle"
                onClick={toggleDropdown}
              >
                <div className="user-avatar">
                  {getUserInitials()}
                </div>
                <span className="user-name">{user.name}</span>
                <i className="bi bi-chevron-down"></i>
              </button>
              
              {dropdownOpen && (
                <div className="user-dropdown-menu">
                  <Link 
                    to="/profile" 
                    className="user-dropdown-item" 
                    onClick={closeDropdown}
                  >
                    <i className="bi bi-person-circle"></i>
                    <span>Profile</span>
                  </Link>
                  
                  {user.role === 'admin' && (
                    <Link 
                      to="/users" 
                      className="user-dropdown-item" 
                      onClick={closeDropdown}
                    >
                      <i className="bi bi-people-fill"></i>
                      <span>User Management</span>
                    </Link>
                  )}
                  
                  <div className="user-dropdown-divider"></div>
                  
                  <a 
                    href="#" 
                    className="user-dropdown-item" 
                    onClick={(e) => {
                      e.preventDefault();
                      closeDropdown();
                      onLogout();
                    }}
                  >
                    <i className="bi bi-box-arrow-right"></i>
                    <span>Logout</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Header;