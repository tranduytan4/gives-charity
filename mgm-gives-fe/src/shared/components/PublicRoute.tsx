import { Outlet } from 'react-router-dom';

// PublicRoute: accessible by anyone, regardless of auth state.
// Use this for pages like email verification that must work when logged in or not.
const PublicRoute = () => {
  return <Outlet />;
};

export default PublicRoute;
