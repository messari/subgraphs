import ProtocolDashboard from "./interfaces/ProtocolDashboard";
import DeploymentsPage from "./deployments/DeploymentsPage";
import { Route, Routes } from "react-router";
import { dashboardVersion, DashboardVersion } from "./common/DashboardVersion";
import IssuesDisplay from "./interfaces/IssuesDisplay";
import { DashboardHeader } from "./graphs/DashboardHeader";
import { useState } from "react";
import DefiLlamaComparsionTab from "./interfaces/DefiLlamaComparisonTab";
import { schemaMapping } from "./utils";
import DeploymentsInDevelopment from "./deployments/DeploymentsInDevelopment";

function App() {
  console.log('RUNNING VERSION ' + dashboardVersion);
  const [protocolsToQuery, setProtocolsToQuery] = useState<{
    [type: string]: { [proto: string]: { [network: string]: string } };
  }>({});

  const getDeployments = () => {
    fetch("https://raw.githubusercontent.com/messari/subgraphs/master/deployment/deployment.json", {
      method: "GET",
      headers: {
        Accept: "*/*",
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
      });
  };

  const depoCount: any = { all: { totalCount: 0, prodCount: 0, devCount: 0 } };
  // Construct subgraph endpoints
  const subgraphEndpoints: { [x: string]: any } = {};

  if (Object.keys(protocolsToQuery)?.length > 0) {
    Object.keys(protocolsToQuery).forEach((protocolName: string) => {
      const protocol: any = protocolsToQuery[protocolName];
      let isDev = false;
      let schemaType = protocol.schema;
      if (schemaMapping[protocol.schema]) {
        schemaType = schemaMapping[protocol.schema];
      }
      if (schemaType) {
        if (!Object.keys(subgraphEndpoints).includes(schemaType)) {
          subgraphEndpoints[schemaType] = {};
        }
        if (!Object.keys(subgraphEndpoints[schemaType]).includes(protocolName)) {
          subgraphEndpoints[schemaType][protocolName] = {};
        }
      }
      Object.values(protocol.deployments).forEach((depoData: any) => {
        if (!depoData?.services) {
          return;
        }
        if (schemaType && (!!depoData["services"]["hosted-service"] || !!depoData["services"]["decentralized-network"])) {
          if (!!subgraphEndpoints[schemaType][protocolName][depoData.network]) {
            const protocolKeyArr = depoData["services"]["hosted-service"]["slug"].split('-');
            const networkKey = protocolKeyArr.pop();
            subgraphEndpoints[schemaType][protocolKeyArr.join('-')] = {};
            subgraphEndpoints[schemaType][protocolKeyArr.join('-')][networkKey] = "https://api.thegraph.com/subgraphs/name/messari/" + depoData["services"]["hosted-service"]["slug"];
          } else {
            subgraphEndpoints[schemaType][protocolName][depoData.network] = "https://api.thegraph.com/subgraphs/name/messari/" + depoData["services"]["hosted-service"]["slug"];
          }
        }
        if (!depoCount[schemaType]) {
          depoCount[schemaType] = { totalCount: 0, prodCount: 0, devCount: 0 };
        }
        depoCount.all.totalCount += 1;
        depoCount[schemaType].totalCount += 1;
        if (depoData?.status === 'dev') {
          isDev = true;
        }
      })
      if (isDev) {
        depoCount.all.devCount += 1;
        depoCount[schemaType].devCount += 1;
      } else {
        depoCount.all.prodCount += 1;
        depoCount[schemaType].prodCount += 1;
      }
    })
  }
  return (
    <div>
      <DashboardVersion />
      <Routes>
        <Route path="/">
          <Route index element={<DeploymentsPage getData={() => getDeployments()} protocolsToQuery={protocolsToQuery} subgraphCounts={depoCount} />} />
          <Route
            path="comparison"
            element={<DefiLlamaComparsionTab deploymentJSON={subgraphEndpoints} getData={() => getDeployments()} />}
          />
          <Route path="development-status" element={<DeploymentsInDevelopment protocolsToQuery={protocolsToQuery} getData={() => getDeployments()} />} />
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