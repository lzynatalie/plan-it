import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import PrivateRoute from "./components/private-route/PrivateRoute";
import LoginPage from "./pages/login/LoginPage";
import RegisterPage from "./pages/register/RegisterPage";
import HomePage from "./pages/home/HomePage";
import ResetPasswordPage from "./pages/login/pages/ResetPasswordPage";
import UpdatePasswordPage from "./pages/login/pages/UpdatePasswordPage";
import CreateProfilePage from "./pages/register/pages/CreateProfilePage";
import CalendarPage from "./pages/calendar/CalendarPage";
import FriendsPage from "./pages/friends/FriendsPage";
import GroupsPage from "./pages/groups/GroupsPage";
import EventsPage from "./pages/events/EventsPage";
import VenuesPage from "./pages/venues/VenuesPage";

export const router = createBrowserRouter([
  { path: "/", element: <App /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  {
    path: "/create-profile",
    element: (
      <PrivateRoute>
        <CreateProfilePage />
      </PrivateRoute>
    ),
  },
  { path: "/reset-password", element: <ResetPasswordPage /> },
  {
    path: "/update-password",
    element: (
      <PrivateRoute>
        <UpdatePasswordPage />
      </PrivateRoute>
    ),
  },
  {
    path: "/home",
    element: (
      <PrivateRoute>
        <HomePage />
      </PrivateRoute>
    ),
  },
  {
    path: "/calendar",
    element: (
      <PrivateRoute>
        <CalendarPage />
      </PrivateRoute>
    ),
  },
  {
    path: "/friends",
    element: (
      <PrivateRoute>
        <FriendsPage />
      </PrivateRoute>
    ),
  },
  {
    path: "/groups",
    element: (
      <PrivateRoute>
        <GroupsPage />
      </PrivateRoute>
    ),
  },
  {
    path: "/events",
    element: (
      <PrivateRoute>
        <EventsPage />
      </PrivateRoute>
    ),
  },
  {
    path: "/venues",
    element: (
      <PrivateRoute>
        <VenuesPage />
      </PrivateRoute>
    ),
  },
]);
