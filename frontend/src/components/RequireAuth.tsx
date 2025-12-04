import { Navigate, useLocation } from "react-router-dom";

type Props = {
  children: JSX.Element;
};

export default function RequireAuth({ children }: Props) {
  const token = localStorage.getItem("access_token");
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
