import ProtocolDashboard from "./interfaces/ProtocolDashboard";
import DeploymentsPage from "./deployments/DeploymentsPage";
import { Route, Routes } from "react-router";
import { DashboardVersion } from "./common/DashboardVersion";

function App() {
  return (
    <div>
      <DashboardVersion />
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
