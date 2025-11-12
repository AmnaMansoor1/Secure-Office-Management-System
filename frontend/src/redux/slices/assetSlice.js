// src/redux/slices/assetSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import assetService from '../../services/assetService';

const initialState = {
  assets: [],
  asset: null,
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: ''
};

// Get all assets
export const getAssets = createAsyncThunk(
  'assets/getAll',
  async (_, thunkAPI) => {
    try {
      return await assetService.getAssets();
    } catch (error) {
      const message = 
        (error.response && 
          error.response.data && 
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get single asset
export const getAsset = createAsyncThunk(
  'assets/get',
  async (id, thunkAPI) => {
    try {
      return await assetService.getAsset(id);
    } catch (error) {
      const message = 
        (error.response && 
          error.response.data && 
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Create asset
export const createAsset = createAsyncThunk(
  'assets/create',
  async (assetData, thunkAPI) => {
    try {
      return await assetService.createAsset(assetData);
    } catch (error) {
      const message = 
        (error.response && 
          error.response.data && 
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Update asset
export const updateAsset = createAsyncThunk(
  'assets/update',
  async ({ id, assetData }, thunkAPI) => {
    try {
      return await assetService.updateAsset(id, assetData);
    } catch (error) {
      const message = 
        (error.response && 
          error.response.data && 
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Delete asset
export const deleteAsset = createAsyncThunk(
  'assets/delete',
  async (id, thunkAPI) => {
    try {
      await assetService.deleteAsset(id);
      return id;
    } catch (error) {
      const message = 
        (error.response && 
          error.response.data && 
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const assetSlice = createSlice({
  name: 'assets',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';
    },
    setAsset: (state, action) => {
      state.asset = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAssets.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAssets.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.assets = action.payload;
      })
      .addCase(getAssets.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getAsset.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAsset.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.asset = action.payload;
      })
      .addCase(getAsset.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(createAsset.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createAsset.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.assets.push(action.payload);
      })
      .addCase(createAsset.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(updateAsset.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateAsset.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.assets = state.assets.map(asset => 
          asset._id === action.payload._id ? action.payload : asset
        );
        state.asset = action.payload;
      })
      .addCase(updateAsset.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(deleteAsset.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteAsset.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.assets = state.assets.filter(asset => 
          asset._id !== action.payload
        );
      })
      .addCase(deleteAsset.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  }
});

export const { reset, setAsset } = assetSlice.actions;
export default assetSlice.reducer;




