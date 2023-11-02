import ProtocolDashboard from "./interfaces/ProtocolDashboard";
import DeploymentsPage from "./deployments/DeploymentsPage";
import IssuesDisplay from "./interfaces/IssuesDisplay";
import ProtocolsListByTVL from "./deployments/ProtocolsListByTVL";
import VersionComparison from "./deployments/VersionComparison";
import { DashboardHeader } from "./common/headerComponents/DashboardHeader";
import { dashboardVersion, DashboardVersion } from "./common/DashboardVersion";
import { Route, Routes } from "react-router";
import { useEffect, useMemo, useState } from "react";
import { NewClient, schemaMapping } from "./utils";
import { useQuery } from "@apollo/client";
import { decentralizedNetworkSubgraphsQuery } from "./queries/decentralizedNetworkSubgraphsQuery";

function App() {
  console.log("RUNNING VERSION " + dashboardVersion);
  const [loading, setLoading] = useState(false);
  const [protocolsToQuery, setProtocolsToQuery] = useState<{
    [type: string]: { [proto: string]: { [network: string]: string } };
  }>({});

  const [issuesMapping, setIssuesMapping] = useState<any>({});

  const getGithubRepoIssues = () => {
    try {
      fetch(process.env.REACT_APP_GITHUB_ISSUES_URL! + "?per_page=100&state=open&sort=updated", {
        method: "GET",
        headers: {
          Accept: "*/*",
        },
      })
        .then(function (res) {
          return res.json();
        })
        .then(function (json) {
          if (Array.isArray(json)) {
            let newIssuesMapping: { [x: string]: string } = {};
            json.forEach((x: { [x: string]: any }) => {
              const key: string = x.title.toUpperCase().split(" ").join(" ") || "";
              newIssuesMapping[key] = x.html_url;
            });
            setIssuesMapping(newIssuesMapping);
          }
        })
        .catch((err) => {
          console.log(err);
        });
    } catch (error) {
      console.error(error);
    }
  };

  const getDeployments = () => {
    if (Object.keys(protocolsToQuery).length === 0) {
      setLoading(true);
      try {
        fetch(process.env.REACT_APP_MESSARI_STATUS_URL!, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "x-messari-api-key": process.env.REACT_APP_MESSARI_API_KEY!,
          },
        })
          .then(function (res) {
            return res.json();
          })
          .then(function (json) {
            setLoading(false);
            setProtocolsToQuery(json);
          })
          .catch((err) => {
            console.log(err);
          });
      } catch (error) {
        setLoading(false);
        console.error(error);
      }
    }
  };

  const depoCount: { [x: string]: { totalCount: number; prodCount: number; devCount: number } } = {
    all: { totalCount: 0, prodCount: 0, devCount: 0 },
  };
  // Construct subgraph endpoints
  const subgraphEndpoints: { [x: string]: any } = {};
  if (Object.keys(protocolsToQuery)?.length > 0) {
    Object.keys(protocolsToQuery).forEach((protocolName: string) => {
      const protocol: { [x: string]: any } = protocolsToQuery[protocolName];
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
        if (
          schemaType &&
          (!!depoData["services"]["hosted-service"] || !!depoData["services"]["decentralized-network"])
        ) {
          if (!!subgraphEndpoints[schemaType][protocolName][depoData.network]) {
            const protocolKeyArr = depoData["services"]["hosted-service"]["slug"].split("-");
            const networkKey = protocolKeyArr.pop();
            subgraphEndpoints[schemaType][protocolKeyArr.join("-")] = {};
            subgraphEndpoints[schemaType][protocolKeyArr.join("-")][networkKey] =
              process.env.REACT_APP_GRAPH_BASE_URL! +
              "/subgraphs/name/messari/" +
              depoData["services"]["hosted-service"]["slug"];
          } else {
            subgraphEndpoints[schemaType][protocolName][depoData.network] =
              process.env.REACT_APP_GRAPH_BASE_URL! +
              "/subgraphs/name/messari/" +
              depoData["services"]["hosted-service"]["slug"];
          }
        }
        if (!depoCount[schemaType]) {
          depoCount[schemaType] = { totalCount: 0, prodCount: 0, devCount: 0 };
        }
        depoCount.all.totalCount += 1;
        depoCount[schemaType].totalCount += 1;
        if (depoData?.status === "dev") {
          isDev = true;
        }
      });
      if (isDev) {
        depoCount.all.devCount += 1;
        depoCount[schemaType].devCount += 1;
      } else {
        depoCount.all.prodCount += 1;
        depoCount[schemaType].prodCount += 1;
      }
    });
  }

  useEffect(() => {
    getGithubRepoIssues();
  }, []);

  const [decentralizedDeployments, setDecentralizedDeployments] = useState<{
    [type: string]: { [network: string]: any };
  }>({});

  const clientDecentralizedEndpoint = useMemo(
    () => NewClient(process.env.REACT_APP_GRAPH_BASE_URL! + "/subgraphs/name/graphprotocol/graph-network-arbitrum"),
    [],
  );

  const { data: decentralized } = useQuery(decentralizedNetworkSubgraphsQuery, {
    client: clientDecentralizedEndpoint,
  });

  useEffect(() => {
    if (decentralized && !Object.keys(decentralizedDeployments)?.length) {
      const decenDepos: { [x: string]: any } = {};
      const subgraphsOnDecenAcct = [
        ...decentralized.graphAccounts[0].subgraphs,
        // ...decentralized.graphAccounts[1].subgraphs,
      ];
      subgraphsOnDecenAcct.forEach((sub: { [x: string]: any }) => {
        try {
          let name = sub.currentVersion?.subgraphDeployment?.originalName?.toLowerCase()?.split(" ");
          if (!name) {
            name = sub?.displayName?.toLowerCase()?.split(" ");
          }
          name.pop();
          name = name.join("-");
          const network = sub.currentVersion.subgraphDeployment.network.id;
          const deploymentId = sub.currentVersion.subgraphDeployment.ipfsHash;
          const signalledTokens = sub.currentVersion.subgraphDeployment.signalledTokens;
          const subgraphId = sub.id;
          if (!(name in decenDepos)) {
            decenDepos[name] = [];
          }
          decenDepos[name].push({ network, deploymentId, subgraphId, signalledTokens });
        } catch (err) {
          return;
        }
      });
      setDecentralizedDeployments(decenDepos);
    }
  }, [decentralized]);

  return (
    <div>
      <DashboardVersion />
      <Routes>
        <Route path="/">
          <Route
            index
            element={
              <DeploymentsPage
                issuesMapping={issuesMapping}
                getData={() => getDeployments()}
                loading={loading}
                protocolsToQuery={protocolsToQuery}
                subgraphCounts={depoCount}
                decentralizedDeployments={decentralizedDeployments}
              />
            }
          />
          <Route
            path="subgraph"
            element={
              <ProtocolDashboard
                protocolJSON={protocolsToQuery}
                getData={() => getDeployments()}
                subgraphEndpoints={subgraphEndpoints}
                decentralizedDeployments={decentralizedDeployments}
              />
            }
          />
          <Route
            path="protocols-list"
            element={<ProtocolsListByTVL protocolsToQuery={protocolsToQuery} getData={() => getDeployments()} />}
          />
          <Route
            path="version-comparison"
            element={<VersionComparison protocolsToQuery={protocolsToQuery} getData={() => getDeployments()} />}
          />
          <Route
            path="*"
            element={
              <>
                <DashboardHeader
                  protocolData={undefined}
                  versionsJSON={{}}
                  protocolId=""
                  subgraphToQueryURL=""
                  schemaVersion=""
                />
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
