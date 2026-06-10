import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user:        localStorage.getItem('flare_user')    || null,
    accountType: localStorage.getItem('flare_role')    || null,
    token:       localStorage.getItem('flare_token')   || null,
    userId:      localStorage.getItem('flare_user_id') || null,
  },
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
    },
    setAccountType: (state, action) => {
      state.accountType = action.payload;
    },
    setToken: (state, action) => {
      state.token = action.payload;
    },
    setUserId: (state, action) => {
      state.userId = action.payload;
    },
    logout: (state) => {
      state.user        = null;
      state.accountType = null;
      state.token       = null;
      state.userId      = null;
      localStorage.removeItem('flare_token');
      localStorage.removeItem('flare_user');
      localStorage.removeItem('flare_role');
      localStorage.removeItem('flare_user_id');
    },
  },
});

export const { setUser, setAccountType, setToken, setUserId, logout } = authSlice.actions;
export default authSlice.reducer;
