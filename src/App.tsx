import "./App.css";
import HomePage from "./pages/home/HomePage";
import PrivateRoute from "./components/private-route/PrivateRoute";

function App() {
  return (
    <div className="App">
      <PrivateRoute>
        <HomePage />
      </PrivateRoute>
    </div>
  );
}

export default App;
