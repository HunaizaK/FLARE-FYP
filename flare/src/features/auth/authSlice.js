import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user:        sessionStorage.getItem('flare_user')    || null,
    accountType: sessionStorage.getItem('flare_role')    || null,
    token:       sessionStorage.getItem('flare_token')   || null,
    userId:      sessionStorage.getItem('flare_user_id') || null,
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
      sessionStorage.removeItem('flare_token');
      sessionStorage.removeItem('flare_user');
      sessionStorage.removeItem('flare_role');
      sessionStorage.removeItem('flare_user_id');
    },
  },
});

export const { setUser, setAccountType, setToken, setUserId, logout } = authSlice.actions;
export default authSlice.reducer;
