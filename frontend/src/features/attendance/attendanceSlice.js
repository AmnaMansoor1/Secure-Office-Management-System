// src/features/attendance/attendanceSlice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { fetchAttendance, markAttendance, updateAttendance, deleteAttendance } from '../../services/attendanceService';

export const getAttendance = createAsyncThunk('attendance/get', async (params, { rejectWithValue }) => {
  try {
    const data = await fetchAttendance(params || {});
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const createAttendance = createAsyncThunk('attendance/create', async (payload, { rejectWithValue }) => {
  try {
    const data = await markAttendance(payload);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const editAttendance = createAsyncThunk('attendance/edit', async ({ id, payload }, { rejectWithValue }) => {
  try {
    const data = await updateAttendance(id, payload);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const removeAttendance = createAsyncThunk('attendance/remove', async (id, { rejectWithValue }) => {
  try {
    await deleteAttendance(id);
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState: {
    records: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getAttendance.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(getAttendance.fulfilled, (state, action) => { state.loading = false; state.records = action.payload; })
      .addCase(getAttendance.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(createAttendance.fulfilled, (state, action) => { state.records.unshift(action.payload); })

      .addCase(editAttendance.fulfilled, (state, action) => {
        const idx = state.records.findIndex(r => r._id === action.payload._id);
        if (idx !== -1) state.records[idx] = action.payload;
      })

      .addCase(removeAttendance.fulfilled, (state, action) => {
        state.records = state.records.filter(r => r._id !== action.payload);
      });
  }
});

export default attendanceSlice.reducer;