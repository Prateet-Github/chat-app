import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // While loading session → show a centered loader
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Checking authentication...</p>
      </div>
    );
  }

  // If no user → redirect to login, but remember the attempted route
  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // If authenticated → render the child component
  return children;
};

export default ProtectedRoute;