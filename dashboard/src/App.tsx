import ProtocolDashboard from "./interfaces/ProtocolDashboard";
import DeploymentsPage from "./deployments/DeploymentsPage";
import { Route, Routes } from "react-router";
import { DashboardVersion } from "./common/DashboardVersion";
import IssuesDisplay from "./interfaces/IssuesDisplay";
import { DashboardHeader } from "./graphs/DashboardHeader";

function App() {
  return (
    <div>
      <DashboardVersion />
      <Routes>
        <Route path="/">
          <Route index element={<DeploymentsPage />} />
          <Route path="subgraph" element={<ProtocolDashboard />} />
          <Route
            path="*"
            element={
              <>
                <DashboardHeader protocolData={undefined} protocolId="" subgraphToQueryURL="" schemaVersion="" />
                <IssuesDisplay
                  oneLoaded={true}
                  allLoaded={true}
                  issuesArrayProps={[
                    {
                      message: "404: The route entered does not exist.",
                      type: "404",
                      level: "critical",
                      fieldName: "",
                    },
                  ]}
                />
              </>
            }
          />
        </Route>
      </Routes>
    </div>
  );
}

export default App;
