// src/features/leave/leaveSlice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { fetchLeaveRequests, applyLeave, decideLeave, deleteLeave } from '../../services/leaveService';

export const getLeaveRequests = createAsyncThunk('leave/get', async (params, { rejectWithValue }) => {
  try {
    const data = await fetchLeaveRequests(params || {});
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const createLeaveRequest = createAsyncThunk('leave/create', async (payload, { rejectWithValue }) => {
  try {
    const data = await applyLeave(payload);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const manageLeaveRequest = createAsyncThunk('leave/manage', async ({ id, action, comments }, { rejectWithValue }) => {
  try {
    const data = await decideLeave(id, { action, comments });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const removeLeaveRequest = createAsyncThunk('leave/remove', async (id, { rejectWithValue }) => {
  try {
    await deleteLeave(id);
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

const leaveSlice = createSlice({
  name: 'leave',
  initialState: {
    requests: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getLeaveRequests.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(getLeaveRequests.fulfilled, (state, action) => { state.loading = false; state.requests = action.payload; })
      .addCase(getLeaveRequests.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(createLeaveRequest.fulfilled, (state, action) => { state.requests.unshift(action.payload); })

      .addCase(manageLeaveRequest.fulfilled, (state, action) => {
        const idx = state.requests.findIndex(r => r._id === action.payload._id);
        if (idx !== -1) state.requests[idx] = action.payload;
      })

      .addCase(removeLeaveRequest.fulfilled, (state, action) => {
        state.requests = state.requests.filter(r => r._id !== action.payload);
      });
  }
});

export default leaveSlice.reducer;