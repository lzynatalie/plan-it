import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import Login from "./components/login-register/Login";
import Register from "./components/login-register/Register";
import Home from "./components/home/Home";
import PrivateRoute from "./components/route/PrivateRoute";
import ResetPassword from "./components/login-register/ResetPassword";
import UpdatePassword from "./components/login-register/UpdatePassword";
import CreateProfile from "./components/login-register/CreateProfile";

export const router = createBrowserRouter([
  { path: "/", element: <App /> },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  {
    path: "/create-profile",
    element: (
      <PrivateRoute>
        <CreateProfile />
      </PrivateRoute>
    ),
  },
  { path: "/reset-password", element: <ResetPassword /> },
  {
    path: "/change-password",
    element: (
      <PrivateRoute>
        <UpdatePassword />
      </PrivateRoute>
    ),
  },
  {
    path: "/home",
    element: (
      <PrivateRoute>
        <Home />
      </PrivateRoute>
    ),
  },
]);
