import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from '../pages/Landing';
import Login from '../pages/auth/Login';
import CreateAcc from '../pages/auth/createAcc';
import SignUp from '../pages/auth/SignUp';
import ApprovalScreen from '../pages/auth/ApprovalScreen';
import Maps from '../pages/Maps';
import ShelterManagement from '../pages/stubs/ShelterManagement';
import Reports from '../pages/stubs/Reports';
import LostFound from '../pages/stubs/LostFound';
import Donation from '../pages/stubs/Donation';
import Settings from '../pages/stubs/Settings';
import SignUpApproval from '../pages/admin/SignUpApproval';
import ReportApproval from '../pages/admin/ReportApproval';
import ShelterApproval from '../pages/admin/ShelterApproval';
import DonationApproval from '../pages/admin/DonationApproval';
import LostFoundApproval from '../pages/admin/LostFoundApproval';
import ShelterList from '../pages/admin/ShelterList';
import UserList from '../pages/admin/UserList';
import EditLostFound from '../pages/stubs/EditLostFound';
import MyRequests from '../pages/stubs/MyRequests';
import ProtectedRoute from '../components/ProtectedRoute';

const ALL_ROLES = ['admin', 'organization', 'citizen'];
const ORG_CITIZEN = ['organization', 'citizen'];

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login"    element={<Login />} />
        <Route path="/createacc" element={<CreateAcc />} />
        <Route path="/signup"   element={<SignUp />} />
        <Route path="/approval" element={<ApprovalScreen />} />

        {/* Shared across all roles */}
        <Route path="/maps" element={
          <ProtectedRoute allowedRoles={ALL_ROLES}>
            <Maps />
          </ProtectedRoute>
        } />

        {/* Organization + Citizen */}
        <Route path="/reports" element={
          <ProtectedRoute allowedRoles={ALL_ROLES}>
            <Reports />
          </ProtectedRoute>
        } />
        <Route path="/lost-found" element={
          <ProtectedRoute allowedRoles={ALL_ROLES}>
            <LostFound />
          </ProtectedRoute>
        } />
        <Route path="/donation" element={
          <ProtectedRoute allowedRoles={ALL_ROLES}>
            <Donation />
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute allowedRoles={ALL_ROLES}>
            <Settings />
          </ProtectedRoute>
        } />

        {/* Organization + Citizen */}
        <Route path="/my-requests" element={
          <ProtectedRoute allowedRoles={['organization', 'citizen']}>
            <MyRequests />
          </ProtectedRoute>
        } />

        {/* Organization only */}
        <Route path="/shelter-management" element={
          <ProtectedRoute allowedRoles={['organization']}>
            <ShelterManagement />
          </ProtectedRoute>
        } />

        {/* Admin only */}
        <Route path="/lost-found/edit" element={
          <ProtectedRoute allowedRoles={ORG_CITIZEN}>
            <EditLostFound />
          </ProtectedRoute>
        } />
        <Route path="/admin/lostfound-approvals" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <LostFoundApproval />
          </ProtectedRoute>
        } />
        <Route path="/admin/users" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <UserList />
          </ProtectedRoute>
        } />
        <Route path="/admin/signup-approvals" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <SignUpApproval />
          </ProtectedRoute>
        } />
        <Route path="/admin/report-approval" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ReportApproval />
          </ProtectedRoute>
        } />
        <Route path="/admin/shelter-list" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ShelterList />
          </ProtectedRoute>
        } />
        <Route path="/admin/shelter-approvals" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ShelterApproval />
          </ProtectedRoute>
        } />
        <Route path="/admin/donation-approvals" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DonationApproval />
          </ProtectedRoute>
        } />

        <Route path="/" element={<Landing />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
