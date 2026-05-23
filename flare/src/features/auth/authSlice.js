import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    role: null,
    accountType: null, // 'organization' or 'citizen'
    token: null,
    isLoading: false,
    error: null,
  },
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
    },
    setAccountType: (state, action) => {
      state.accountType = action.payload;
    },
    setRole: (state, action) => {
      state.role = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.role = null;
      state.accountType = null;
      state.token = null;
    },
  },
});

export const { setUser, setAccountType, setRole, logout } = authSlice.actions;
export default authSlice.reducer;