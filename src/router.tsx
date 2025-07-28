import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import PrivateRoute from "./components/private-route/PrivateRoute";
import CalendarPage from "./pages/calendar/CalendarPage";
import EventsPage from "./pages/events/EventsPage";
import EventPage from "./pages/events/pages/EventPage";
import FriendsPage from "./pages/friends/FriendsPage";
import UserPage from "./pages/friends/pages/UserPage";
import GroupsPage from "./pages/groups/GroupsPage";
import GroupPage from "./pages/groups/pages/GroupPage";
import HomePage from "./pages/home/HomePage";
import LoginPage from "./pages/login/LoginPage";
import ResetPasswordPage from "./pages/login/pages/ResetPasswordPage";
import UpdatePasswordPage from "./pages/login/pages/UpdatePasswordPage";
import CreateProfilePage from "./pages/register/pages/CreateProfilePage";
import RegisterPage from "./pages/register/RegisterPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      {
        path: "home",
        element: <HomePage />,
      },
      {
        path: "calendar",
        element: <CalendarPage />,
      },
      {
        path: "events",
        element: <EventsPage />,
      },
      {
        path: "events/:eventId",
        element: <EventPage />,
      },
      {
        path: "friends",
        element: <FriendsPage />,
      },
      {
        path: "users/:username",
        element: <UserPage />,
      },
      {
        path: "groups",
        element: <GroupsPage />,
      },
      {
        path: "groups/:groupId",
        element: <GroupPage />,
      },
    ],
  },
  { path: "/login", element: <LoginPage /> },
  { path: "/reset-password", element: <ResetPasswordPage /> },
  {
    path: "/update-password",
    element: (
      <PrivateRoute>
        <UpdatePasswordPage />
      </PrivateRoute>
    ),
  },
  { path: "/register", element: <RegisterPage /> },
  {
    path: "/create-profile",
    element: (
      <PrivateRoute>
        <CreateProfilePage />
      </PrivateRoute>
    ),
  },
]);
