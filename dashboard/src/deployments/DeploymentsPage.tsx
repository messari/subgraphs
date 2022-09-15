import { styled } from "../styled";
import { useNavigate } from "react-router";
import { SearchInput } from "../common/utilComponents/SearchInput";
import { DeploymentsContextProvider } from "./DeploymentsContextProvider";
import { Button, Typography } from "@mui/material";
import { NewClient } from "../utils";
import { useEffect, useMemo, useState } from "react";
import DeploymentsTable from "./DeploymentsTable";
import { useQuery } from "@apollo/client";
import { decentralizedNetworkSubgraphsQuery } from "../queries/decentralizedNetworkSubgraphsQuery";
import DefiLlamaComparsionTab from "../interfaces/DefiLlamaComparisonTab";
import DeploymentsInDevelopment from "./DeploymentsInDevelopment";

const DeploymentsLayout = styled("div")`
  padding: 0;
`;

interface DeploymentsPageProps {
  protocolsToQuery: { [x: string]: any };
  deploymentsInDevelopment: { [x: string]: any };
  getData: any;
  getDevDeployments: any;
  subgraphCounts: any;
}

function DeploymentsPage({ protocolsToQuery, getData, getDevDeployments, deploymentsInDevelopment, subgraphCounts }: DeploymentsPageProps) {
  const [decentralizedDeployments, setDecentralizedDeployments] = useState<{
    [type: string]: { [proto: string]: { [network: string]: string } };
  }>({});

  const [showDeploymentsInDevelopment, toggleShowDeploymentsInDevelopment] = useState<boolean>(false);

  const clientDecentralizedEndpoint = useMemo(
    () => NewClient("https://api.thegraph.com/subgraphs/name/graphprotocol/graph-network-mainnet"),
    [],
  );
  const {
    data: decentralized,
    error: decentralizedQueryError,
    loading: decentralizedQueryLoading,
  } = useQuery(decentralizedNetworkSubgraphsQuery, {
    client: clientDecentralizedEndpoint,
  });

  useEffect(() => {
    getData();
    getDevDeployments();
  }, []);

  useEffect(() => {
    if (decentralized && !Object.keys(decentralizedDeployments)?.length) {
      const decenDepos: { [x: string]: any } = { exchanges: {}, lending: {}, vaults: {}, generic: {} };
      const subs = decentralized.graphAccount.subgraphs;
      subs.forEach((sub: any, idx: number) => {
        try {
          let name = sub.currentVersion?.subgraphDeployment?.originalName?.toLowerCase()?.split(" ");
          if (!name) {
            name = sub?.displayName?.toLowerCase()?.split(" ");
          }
          name.pop();
          name = name.join("-");
          const network = sub.currentVersion.subgraphDeployment.network.id;
          const deploymentId = sub.currentVersion.subgraphDeployment.ipfsHash;
          const subgraphId = sub.id;
          const schemaVersion = sub.currentVersion.subgraphDeployment.schema
            .split("\n")
            .join("")
            .split("#")
            .find((x: string[]) => x.includes("Version:"))
            .split("Version:")[1]
            .trim();
          const protocolTypeRaw = sub.currentVersion.subgraphDeployment.schema
            .split("\n")
            .join("")
            .split("#")
            .find((x: string[]) => x.includes("Subgraph Schema:"))
            .split("Subgraph Schema:")[1]
            .trim();
          let protocolType = "generic";
          if (protocolTypeRaw.toUpperCase().includes("LEND")) {
            protocolType = "lending";
          } else if (
            protocolTypeRaw.toUpperCase().includes("EXCHANGE") ||
            protocolTypeRaw.toUpperCase().includes("DEX")
          ) {
            protocolType = "exchanges";
          } else if (protocolTypeRaw.toUpperCase().includes("VAULT") || protocolTypeRaw.toUpperCase().includes("YIELD")) {
            protocolType = "vaults";
          }
          decenDepos[protocolType][name] = { network, schemaVersion, deploymentId, subgraphId };
        } catch (err) {
          return;
        }
      });
      setDecentralizedDeployments(decenDepos);
    }
  }, [decentralized]);

  const navigate = useNavigate();
  const clientIndexing = useMemo(() => NewClient("https://api.thegraph.com/index-node/graphql"), []);
  window.scrollTo(0, 0);

  let decentralizedSubgraphTable = null;
  if (Object.keys(decentralizedDeployments)?.length) {
    decentralizedSubgraphTable = Object.keys(decentralizedDeployments).map((key) => {
      const finalDeposList: any = {};
      Object.keys(decentralizedDeployments[key]).forEach((x) => {
        if (Object.keys(protocolsToQuery[key]).find((pro) => pro.includes(x))) {
          finalDeposList[x] = decentralizedDeployments[key][x];
        }
      });

      if (!Object.keys(finalDeposList).length) {
        return null;
      }

      return (
        <>
          <Typography
            key={"typography-" + key}
            variant="h4"
            align="left"
            fontWeight={500}
            fontSize={28}
            sx={{ padding: "6px", my: 2 }}
          >
            {key.toUpperCase()}
          </Typography>
          <DeploymentsTable
            key={"depTable-" + key}
            clientIndexing={clientIndexing}
            protocolsOnType={finalDeposList}
            protocolType={key}
            isDecentralizedNetworkTable={true}
          />
        </>
      );
    });
    decentralizedSubgraphTable.unshift(
      <Typography variant="h4" align="center" sx={{ my: 4 }}>
        Decentralized Network Subgraphs
      </Typography>,
    );
  }

  return (
    <DeploymentsContextProvider>
      <DeploymentsLayout>
        <SearchInput
          onSearch={(val) => {
            if (val) {
              navigate(`subgraph?endpoint=${val}&tab=protocol`);
            }
          }}
          placeholder="Subgraph query name ie. messari/balancer-v2-ethereum"
        >
          Load Subgraph
        </SearchInput>
        <div style={{ width: "100%", textAlign: "right", marginTop: "20px" }}>
          <Button variant="contained" color="primary" onClick={() => navigate("/comparison")}>
            Defi Llama Comparison
          </Button>
        </div>
        <div style={{ width: "100%", textAlign: "right", marginTop: "30px" }}>
          <Button variant="contained" color="primary" onClick={() => toggleShowDeploymentsInDevelopment(!showDeploymentsInDevelopment)}>
            {showDeploymentsInDevelopment ? "Hide" : "Show"} Subgraphs In Development
          </Button>
        </div>
        <div style={{ width: "100%", textAlign: "right", marginTop: "30px" }}>
          <Typography variant="h6" align="right" sx={{ fontSize: "14px" }}>
            {subgraphCounts.prodCount} out of {subgraphCounts.totalCount} total subgraphs are production ready
          </Typography>
        </div>

        {showDeploymentsInDevelopment ? <>
          <DeploymentsInDevelopment deploymentsInDevelopment={deploymentsInDevelopment} />
          <div style={{ width: "100%", textAlign: "right", marginTop: "30px" }}>
            <Button variant="contained" color="primary" onClick={() => toggleShowDeploymentsInDevelopment(!showDeploymentsInDevelopment)}>
              {showDeploymentsInDevelopment ? "Hide" : "Show"} Subgraphs In Development
            </Button>
          </div>
        </> : null}
        {decentralizedSubgraphTable}
        <Typography variant="h4" align="center" sx={{ my: 4 }}>
          Hosted Service Subgraphs
        </Typography>
        {Object.keys(protocolsToQuery).map((key) => {
          return (
            <>
              <Typography
                key={"typography-" + key}
                variant="h4"
                align="left"
                fontWeight={500}
                fontSize={28}
                sx={{ padding: "6px", my: 2 }}
              >
                {key.toUpperCase()}
              </Typography>
              <DeploymentsTable
                key={"depTable-" + key}
                clientIndexing={clientIndexing}
                protocolsOnType={protocolsToQuery[key]}
                protocolType={key}
                isDecentralizedNetworkTable={false}
              />
            </>
          );
        })}
      </DeploymentsLayout>
    </DeploymentsContextProvider >
  );
}

export default DeploymentsPage;
