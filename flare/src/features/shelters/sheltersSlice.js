import { createSlice } from '@reduxjs/toolkit';

const load = (key) => { try { return JSON.parse(localStorage.getItem(key)) ?? []; } catch { return []; } };
const save = (key, val) => localStorage.setItem(key, JSON.stringify(val));

const initialState = {
  shelters:              load('flare_approved_shelters'),
  pendingAddShelters:    load('flare_pending_shelters'),
  pendingDeleteShelters: load('flare_pending_delete_shelters'),
  pendingEditShelters:   load('flare_pending_edit_shelters'),
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
      const { id, shelter_name, capacity } = action.payload;
      const s = state.shelters.find((s) => s.id === id);
      if (s) { s.shelter_name = shelter_name; s.capacity = capacity; save('flare_approved_shelters', state.shelters); }
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
    submitEditShelter: (state, action) => {
      state.pendingEditShelters.push(action.payload);
      save('flare_pending_edit_shelters', state.pendingEditShelters);
    },
    approveEditShelter: (state, action) => {
      const edit = state.pendingEditShelters.find((s) => s.id === action.payload);
      if (edit) {
        const shelter = state.shelters.find((s) => s.id === edit.shelterId);
        if (shelter) { shelter.shelter_name = edit.shelter_name; shelter.capacity = edit.capacity; }
        save('flare_approved_shelters', state.shelters);
      }
      state.pendingEditShelters = state.pendingEditShelters.filter((s) => s.id !== action.payload);
      save('flare_pending_edit_shelters', state.pendingEditShelters);
    },
    rejectEditShelter: (state, action) => {
      state.pendingEditShelters = state.pendingEditShelters.filter((s) => s.id !== action.payload);
      save('flare_pending_edit_shelters', state.pendingEditShelters);
    },
    syncFromStorage: (state) => {
      state.shelters              = load('flare_approved_shelters');
      state.pendingAddShelters    = load('flare_pending_shelters');
      state.pendingDeleteShelters = load('flare_pending_delete_shelters');
      state.pendingEditShelters   = load('flare_pending_edit_shelters');
    },
    purgeUserShelters: (state, action) => {
      const username = action.payload;
      state.shelters              = state.shelters.filter((s) => s.email !== username);
      state.pendingAddShelters    = state.pendingAddShelters.filter((s) => s.email !== username);
      state.pendingDeleteShelters = state.pendingDeleteShelters.filter((s) => s.email !== username);
      state.pendingEditShelters   = state.pendingEditShelters.filter((s) => s.email !== username);
      save('flare_approved_shelters',        state.shelters);
      save('flare_pending_shelters',         state.pendingAddShelters);
      save('flare_pending_delete_shelters',  state.pendingDeleteShelters);
      save('flare_pending_edit_shelters',    state.pendingEditShelters);
    },
  },
});

export const {
  submitShelter, approveShelter, rejectShelter,
  editShelter, requestDeleteShelter,
  approveDeleteShelter, rejectDeleteShelter,
  removeShelter,
  submitEditShelter, approveEditShelter, rejectEditShelter,
  purgeUserShelters, syncFromStorage,
} = sheltersSlice.actions;

export default sheltersSlice.reducer;
