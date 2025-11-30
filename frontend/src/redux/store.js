import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import employeeReducer from './slices/employeeSlice';
import assetReducer from './slices/assetSlice';
import expenseReducer from './slices/expenseSlice';
import incomeReducer from './slices/incomeSlice';
import taskReducer from './slices/taskSlice';
import notificationReducer from './slices/notificationSlice';
import attendanceReducer from '../features/attendance/attendanceSlice';
import leaveReducer from '../features/leave/leaveSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    employees: employeeReducer,
    assets: assetReducer,
    expenses: expenseReducer,
    income: incomeReducer,
    tasks: taskReducer,
    notifications: notificationReducer,
    attendance: attendanceReducer,
    leave: leaveReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false
    })
});

export default store;