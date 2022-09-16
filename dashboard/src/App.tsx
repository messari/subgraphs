import ProtocolDashboard from "./interfaces/ProtocolDashboard";
import DeploymentsPage from "./deployments/DeploymentsPage";
import { Route, Routes } from "react-router";
import { DashboardVersion } from "./common/DashboardVersion";
import IssuesDisplay from "./interfaces/IssuesDisplay";
import { DashboardHeader } from "./graphs/DashboardHeader";
import { useState } from "react";
import DefiLlamaComparsionTab from "./interfaces/DefiLlamaComparisonTab";
import { schemaMapping } from "./utils";

function App() {
  const [protocolsToQuery, setProtocolsToQuery] = useState<{
    [type: string]: { [proto: string]: { [network: string]: string } };
  }>({});

  const getDeployments = () => {
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
        setProtocolsToQuery(json);
      })
      .catch((err) => {
        console.log(err);
        fetch("/deploymentsFallback.json", {
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

  const depoCount = { totalCount: 0, prodCount: 0, devCount: 0, otherCount: 0 };
  // Construct subgraph endpoints
  const subgraphEndpoints: { [x: string]: any } = {};

  if (Object.keys(protocolsToQuery)?.length > 0) {
    Object.keys(protocolsToQuery).forEach((protocolName: string) => {
      const protocol: any = protocolsToQuery[protocolName];
      const schemaType = schemaMapping[protocol.schema];
      if (!schemaType) {
        return;
      }
      if (!Object.keys(subgraphEndpoints).includes(schemaType)) {
        subgraphEndpoints[schemaType] = {};
      }
      if (!Object.keys(subgraphEndpoints[schemaType]).includes(protocolName)) {
        subgraphEndpoints[schemaType][protocolName] = {};
      }
      Object.values(protocol.deployments).forEach((depoData: any) => {
        subgraphEndpoints[schemaType][protocolName][depoData.network] = "https://api.thegraph.com/subgraphs/name/messari/" + depoData["deployment-ids"]["hosted-service"];
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
          <Route index element={<DeploymentsPage subgraphCounts={depoCount} getData={() => getDeployments()} protocolsToQuery={subgraphEndpoints} deploymentJSON={protocolsToQuery} />} />
          <Route
            path="comparison"
            element={<DefiLlamaComparsionTab deploymentJSON={subgraphEndpoints} getData={() => getDeployments()} />}
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