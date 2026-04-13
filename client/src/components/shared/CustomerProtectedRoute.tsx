import { Navigate } from 'react-router-dom';

interface CustomerProtectedRouteProps {
  children: React.ReactNode;
}

const CustomerProtectedRoute = ({ children }: CustomerProtectedRouteProps) => {
  const token = localStorage.getItem('customer_token');
  const user = localStorage.getItem('customer_user');

  // Token is the source of truth for customer protected pages.
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // If user payload is missing, allow route. Page-level API calls will enforce auth.
  if (!user) {
    return <>{children}</>;
  }

  try {
    const userData = JSON.parse(user);
    
    // Reject only explicit non-customer roles.
    if (userData.role && userData.role !== 'customer') {
      return <Navigate to="/" replace />;
    }

    // Backfill missing role from legacy/stale payloads to prevent lockout.
    if (!userData.role) {
      const repairedUser = { ...userData, role: 'customer' };
      localStorage.setItem('customer_user', JSON.stringify(repairedUser));
    }

    return <>{children}</>;
  } catch (error) {
    // Invalid user data, clear and redirect
    localStorage.removeItem('customer_token');
    localStorage.removeItem('customer_user');
    return <Navigate to="/" replace />;
  }
};

export default CustomerProtectedRoute;
