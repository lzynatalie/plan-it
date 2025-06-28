import { Outlet } from "react-router-dom";
import Header from "./components/header/Header";
import PrivateRoute from "./components/private-route/PrivateRoute";

import "./App.css";
import "./index.css";

function App() {
  return (
    <div className="container">
      <Header />
      <PrivateRoute>
        <Outlet />
      </PrivateRoute>
    </div>
  );
}

export default App;
