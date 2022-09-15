import ProtocolDashboard from "./interfaces/ProtocolDashboard";
import DeploymentsPage from "./deployments/DeploymentsPage";
import { Route, Routes } from "react-router";
import { DashboardVersion } from "./common/DashboardVersion";
import IssuesDisplay from "./interfaces/IssuesDisplay";
import { DashboardHeader } from "./graphs/DashboardHeader";
import { useState } from "react";
import DefiLlamaComparsionTab from "./interfaces/DefiLlamaComparisonTab";

function App() {
  const [protocolsToQuery, setProtocolsToQuery] = useState<{
    [type: string]: { [proto: string]: { [network: string]: string } };
  }>({});

  const [deploymentsInDevelopment, setDeploymentsInDevelopment] = useState<{
    [type: string]: { [proto: string]: { [network: string]: string } };
  }>({});

  const getDeployments = () => {
    fetch("/deployments.json", {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })
      .then(function (res) {
        return res.json();
      })
      .then(function (json) {
        setProtocolsToQuery(json);
      })
      .catch((err) => {
        console.log(err);
        fetch("/deployments.json", {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        })
          .then(function (res) {
            return res.json();
          })
          .then(function (json) {
            setProtocolsToQuery(json);
          })
          .catch((err) => {
            window.location.reload();
          });
      });
  };

  const getDevDeployments = () => {
    fetch("/deployment.dev.json", {
      headers: {
        Method: "GET",
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })
      .then(function (res) {
        return res.json();
      })
      .then(function (json) {
        setDeploymentsInDevelopment(json);
      })
      .catch((err) => {
        console.log(err);
        fetch("/deployment.dev.json", {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        })
          .then(function (res) {
            return res.json();
          })
          .then(function (json) {
            setDeploymentsInDevelopment(json);
          })
          .catch((err) => {
            console.log('err', err)
          });
      });
  };


  const depoCount = { totalCount: 0, prodCount: 0, devCount: 0, otherCount: 0 };

  if (Object.keys(deploymentsInDevelopment)?.length > 0) {
    Object.values(deploymentsInDevelopment).forEach((protocol) => {
      Object.values(protocol.deployments).forEach((depoData: any) => {
        depoCount.totalCount += 1;
        if (depoData?.status === 'dev') {
          depoCount.prodCount += 1;
        } else if (depoData?.status === 'prod') {
          depoCount.devCount += 1;
        } else {
          depoCount.otherCount += 1;
        }
      })
    })
  }

  return (
    <div>
      <DashboardVersion />
      <Routes>
        <Route path="/">
          <Route index element={<DeploymentsPage subgraphCounts={depoCount} getData={() => getDeployments()} protocolsToQuery={protocolsToQuery} getDevDeployments={() => getDevDeployments()} deploymentsInDevelopment={deploymentsInDevelopment} />} />
          <Route
            path="comparison"
            element={<DefiLlamaComparsionTab deploymentJSON={protocolsToQuery} getData={() => getDeployments()} />}
          />
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
