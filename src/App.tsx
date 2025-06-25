import HomePage from "./pages/home/HomePage";
import PrivateRoute from "./components/private-route/PrivateRoute";
import "./index.css";
import "./App.css";

function App() {
  return (
    <div>
      <PrivateRoute>
        <HomePage />
      </PrivateRoute>
    </div>
  );
}

export default App;
