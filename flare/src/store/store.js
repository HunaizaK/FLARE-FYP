import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import sheltersReducer from '../features/shelters/sheltersSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    shelters: sheltersReducer,
  },
});