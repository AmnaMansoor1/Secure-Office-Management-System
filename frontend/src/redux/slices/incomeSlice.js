// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// import incomeService from '../../services/incomeService';

// const initialState = {
//   incomes: [],
//   income: null,
//   isLoading: false,
//   isSuccess: false,
//   isError: false,
//   message: ''
// };

// // Get all incomes
// export const getIncomes = createAsyncThunk(
//   'incomes/getAll',
//   async (_, thunkAPI) => {
//     try {
//       return await incomeService.getIncomes();
//     } catch (error) {
//       const message = 
//         (error.response && 
//           error.response.data && 
//           error.response.data.message) ||
//         error.message ||
//         error.toString();
//       return thunkAPI.rejectWithValue(message);
//     }
//   }
// );

// // Get single income
// export const getIncome = createAsyncThunk(
//   'incomes/get',
//   async (id, thunkAPI) => {
//     try {
//       return await incomeService.getIncome(id);
//     } catch (error) {
//       const message = 
//         (error.response && 
//           error.response.data && 
//           error.response.data.message) ||
//         error.message ||
//         error.toString();
//       return thunkAPI.rejectWithValue(message);
//     }
//   }
// );

// // Create income
// export const createIncome = createAsyncThunk(
//   'incomes/create',
//   async (incomeData, thunkAPI) => {
//     try {
//       return await incomeService.createIncome(incomeData);
//     } catch (error) {
//       const message = 
//         (error.response && 
//           error.response.data && 
//           error.response.data.message) ||
//         error.message ||
//         error.toString();
//       return thunkAPI.rejectWithValue(message);
//     }
//   }
// );

// // Update income
// export const updateIncome = createAsyncThunk(
//   'incomes/update',
//   async ({ id, incomeData }, thunkAPI) => {
//     try {
//       return await incomeService.updateIncome(id, incomeData);
//     } catch (error) {
//       const message = 
//         (error.response && 
//           error.response.data && 
//           error.response.data.message) ||
//         error.message ||
//         error.toString();
//       return thunkAPI.rejectWithValue(message);
//     }
//   }
// );

// // Delete income
// export const deleteIncome = createAsyncThunk(
//   'incomes/delete',
//   async (id, thunkAPI) => {
//     try {
//       await incomeService.deleteIncome(id);
//       return id;
//     } catch (error) {
//       const message = 
//         (error.response && 
//           error.response.data && 
//           error.response.data.message) ||
//         error.message ||
//         error.toString();
//       return thunkAPI.rejectWithValue(message);
//     }
//   }
// );

// export const incomeSlice = createSlice({
//   name: 'incomes',
//   initialState,
//   reducers: {
//     reset: (state) => {
//       state.isLoading = false;
//       state.isSuccess = false;
//       state.isError = false;
//       state.message = '';
//     },
//     setIncome: (state, action) => {
//       state.income = action.payload;
//     }
//   },
//   extraReducers: (builder) => {
//     builder
//       .addCase(getIncomes.pending, (state) => {
//         state.isLoading = true;
//       })
//       .addCase(getIncomes.fulfilled, (state, action) => {
//         state.isLoading = false;
//         state.isSuccess = true;
//         state.incomes = action.payload;
//       })
//       .addCase(getIncomes.rejected, (state, action) => {
//         state.isLoading = false;
//         state.isError = true;
//         state.message = action.payload;
//       })
//       .addCase(getIncome.pending, (state) => {
//         state.isLoading = true;
//       })
//       .addCase(getIncome.fulfilled, (state, action) => {
//         state.isLoading = false;
//         state.isSuccess = true;
//         state.income = action.payload;
//       })
//       .addCase(getIncome.rejected, (state, action) => {
//         state.isLoading = false;
//         state.isError = true;
//         state.message = action.payload;
//       })
//       .addCase(createIncome.pending, (state) => {
//         state.isLoading = true;
//       })
//       .addCase(createIncome.fulfilled, (state, action) => {
//         state.isLoading = false;
//         state.isSuccess = true;
//         state.incomes.push(action.payload);
//       })
//       .addCase(createIncome.rejected, (state, action) => {
//         state.isLoading = false;
//         state.isError = true;
//         state.message = action.payload;
//       })
//       .addCase(updateIncome.pending, (state) => {
//         state.isLoading = true;
//       })
//       .addCase(updateIncome.fulfilled, (state, action) => {
//         state.isLoading = false;
//         state.isSuccess = true;
//         state.incomes = state.incomes.map(income => 
//           income._id === action.payload._id ? action.payload : income
//         );
//         state.income = action.payload;
//       })
//       .addCase(updateIncome.rejected, (state, action) => {
//         state.isLoading = false;
//         state.isError = true;
//         state.message = action.payload;
//       })
//       .addCase(deleteIncome.pending, (state) => {
//         state.isLoading = true;
//       })
//       .addCase(deleteIncome.fulfilled, (state, action) => {
//         state.isLoading = false;
//         state.isSuccess = true;
//         state.incomes = state.incomes.filter(income => 
//           income._id !== action.payload
//         );
//       })
//       .addCase(deleteIncome.rejected, (state, action) => {
//         state.isLoading = false;
//         state.isError = true;
//         state.message = action.payload;
//       });
//   }
// });

// export const { reset, setIncome } = incomeSlice.actions;
// export default incomeSlice.reducer;



import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import incomeService from '../../services/incomeService';

const initialState = {
  incomes: [],
  income: null,
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: ''
};

// Get all incomes
export const getIncomes = createAsyncThunk(
  'incomes/getAll',
  async (_, thunkAPI) => {
    try {
      return await incomeService.getIncomes();
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

// Get single income
export const getIncome = createAsyncThunk(
  'incomes/get',
  async (id, thunkAPI) => {
    try {
      return await incomeService.getIncome(id);
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

// Create income
export const createIncome = createAsyncThunk(
  'incomes/create',
  async (incomeData, thunkAPI) => {
    try {
      return await incomeService.createIncome(incomeData);
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

// Update income
export const updateIncome = createAsyncThunk(
  'incomes/update',
  async ({ id, incomeData }, thunkAPI) => {
    try {
      return await incomeService.updateIncome(id, incomeData);
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

// Delete income
export const deleteIncome = createAsyncThunk(
  'incomes/delete',
  async (id, thunkAPI) => {
    try {
      await incomeService.deleteIncome(id);
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

export const incomeSlice = createSlice({
  name: 'income',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';
    },
    setIncome: (state, action) => {
      state.income = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(getIncomes.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getIncomes.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.incomes = action.payload;
      })
      .addCase(getIncomes.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getIncome.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getIncome.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.income = action.payload;
      })
      .addCase(getIncome.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(createIncome.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createIncome.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.incomes.push(action.payload);
      })
      .addCase(createIncome.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(updateIncome.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateIncome.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.incomes = state.incomes.map(income => 
          income._id === action.payload._id ? action.payload : income
        );
        state.income = action.payload;
      })
      .addCase(updateIncome.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(deleteIncome.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteIncome.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.incomes = state.incomes.filter(income => 
          income._id !== action.payload
        );
      })
      .addCase(deleteIncome.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  }
});

export const { reset, setIncome } = incomeSlice.actions;
export default incomeSlice.reducer;