import "./App.css";

import ProtocolDashboard from "./interfaces/ProtocolDashboard";
import DeploymentsPage from "./interfaces/DeploymentsPage";
import { Route, Routes } from "react-router";

function App() {
  return (
    <div className="App">
      <h4 style={{ textAlign: "center" }}>Dashboard Version: v1.0.1</h4>
      <Routes>
        <Route path="/">
          <Route index element={<DeploymentsPage />} />
          <Route path="graphs" element={<ProtocolDashboard />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;
