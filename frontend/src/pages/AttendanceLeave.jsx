// src/pages/AttendanceLeave.jsx
import React from 'react';
import { Tabs, Tab } from 'react-bootstrap';
import Attendance from './Attendance';
import Leave from './Leave';

const AttendanceLeave = () => {
  return (
    <div className="p-3">
      <h3>Attendance & Leave</h3>
      <Tabs defaultActiveKey="attendance" className="mb-3">
        <Tab eventKey="attendance" title="Attendance" mountOnEnter>
          <Attendance />
        </Tab>
        <Tab eventKey="leave" title="Leave" mountOnEnter>
          <Leave />
        </Tab>
      </Tabs>
    </div>
  );
};

export default AttendanceLeave;