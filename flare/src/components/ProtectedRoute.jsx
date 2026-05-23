import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const accountType = useSelector((state) => state.auth.accountType);

  if (!accountType) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(accountType)) {
    return <Navigate to="/maps" replace />;
  }

  return children;
};

export default ProtectedRoute;
