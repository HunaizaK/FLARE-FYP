import { createSlice } from '@reduxjs/toolkit';

const load = (key) => { try { return JSON.parse(localStorage.getItem(key)) ?? []; } catch { return []; } };
const save = (key, val) => localStorage.setItem(key, JSON.stringify(val));

const initialState = {
  shelters:              load('flare_approved_shelters'),
  pendingAddShelters:    load('flare_pending_shelters'),
  pendingDeleteShelters: load('flare_pending_delete_shelters'),
};

export const sheltersSlice = createSlice({
  name: 'shelters',
  initialState,
  reducers: {
    submitShelter: (state, action) => {
      state.pendingAddShelters.push(action.payload);
      save('flare_pending_shelters', state.pendingAddShelters);
    },
    approveShelter: (state, action) => {
      const shelter = state.pendingAddShelters.find((s) => s.id === action.payload);
      if (shelter) {
        state.shelters.push(shelter);
        state.pendingAddShelters = state.pendingAddShelters.filter((s) => s.id !== action.payload);
        save('flare_approved_shelters', state.shelters);
        save('flare_pending_shelters', state.pendingAddShelters);
      }
    },
    rejectShelter: (state, action) => {
      state.pendingAddShelters = state.pendingAddShelters.filter((s) => s.id !== action.payload);
      save('flare_pending_shelters', state.pendingAddShelters);
    },
    editShelter: (state, action) => {
      const { id, name, phone } = action.payload;
      const s = state.shelters.find((s) => s.id === id);
      if (s) { s.name = name; s.phone = phone; save('flare_approved_shelters', state.shelters); }
    },
    requestDeleteShelter: (state, action) => {
      state.pendingDeleteShelters.push(action.payload);
      save('flare_pending_delete_shelters', state.pendingDeleteShelters);
    },
    approveDeleteShelter: (state, action) => {
      state.shelters              = state.shelters.filter((s) => s.id !== action.payload);
      state.pendingDeleteShelters = state.pendingDeleteShelters.filter((s) => s.id !== action.payload);
      save('flare_approved_shelters', state.shelters);
      save('flare_pending_delete_shelters', state.pendingDeleteShelters);
    },
    rejectDeleteShelter: (state, action) => {
      state.pendingDeleteShelters = state.pendingDeleteShelters.filter((s) => s.id !== action.payload);
      save('flare_pending_delete_shelters', state.pendingDeleteShelters);
    },
    removeShelter: (state, action) => {
      state.shelters = state.shelters.filter((s) => s.id !== action.payload);
      save('flare_approved_shelters', state.shelters);
    },
  },
});

export const {
  submitShelter, approveShelter, rejectShelter,
  editShelter, requestDeleteShelter,
  approveDeleteShelter, rejectDeleteShelter,
  removeShelter,
} = sheltersSlice.actions;

export default sheltersSlice.reducer;
