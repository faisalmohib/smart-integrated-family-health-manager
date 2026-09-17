import { BrowserRouter, Routes, Route } from "react-router-dom";


import Navbar from "./components/Navbar";
import MedicineReminder from "./components/MedicineReminder";
import SymptomChecker from "./components/SymptomChecker";
import HealthVault from "./components/HealthVault";
import ChatHistoryPage from "./components/ChatHistoryPage";
import Login from "./components/Login";
import Signup from "./components/Signup";

function App() {
  return (
    <BrowserRouter>

      <Navbar />

      <Routes>

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/signup"
          element={<Signup />}
        />

        <Route
          path="/"
          element={<SymptomChecker />}
        />

        <Route
          path="/symptoms"
          element={<SymptomChecker />}
        />

        <Route
          path="/medicine-reminder"
          element={<MedicineReminder />}
        />

        <Route
          path="/health-vault"
          element={<HealthVault />}
        />


        <Route
          path="/chat-history"
          element={<ChatHistoryPage />}
        />



      </Routes>

    </BrowserRouter>
  );
}

export default App;