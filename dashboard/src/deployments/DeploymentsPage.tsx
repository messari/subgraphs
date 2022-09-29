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
import DevCountTable from "./DevCountTable";

const DeploymentsLayout = styled("div")`
  padding: 0;
`;

interface DeploymentsPageProps {
  protocolsToQuery: { [x: string]: any };
  getData: any;
  subgraphCounts: any;
}

function DeploymentsPage({ protocolsToQuery, getData, subgraphCounts }: DeploymentsPageProps) {
  const [decentralizedDeployments, setDecentralizedDeployments] = useState<{
    [type: string]: { [proto: string]: { [network: string]: any } };
  }>({});

  const [showSubgraphCountTable, setShowSubgraphCountTable] = useState<boolean>(false);

  const clientDecentralizedEndpoint = useMemo(
    () => NewClient("https://api.thegraph.com/subgraphs/name/graphprotocol/graph-network-mainnet"),
    [],
  );
  const {
    data: decentralized,
  } = useQuery(decentralizedNetworkSubgraphsQuery, {
    client: clientDecentralizedEndpoint,
  });

  useEffect(() => {
    getData();
  }, []);

  useEffect(() => {
    if (decentralized && !Object.keys(decentralizedDeployments)?.length) {
      const decenDepos: { [x: string]: any } = { exchanges: {}, lending: {}, vaults: {}, generic: {} };
      const subs = [...decentralized.graphAccounts[0].subgraphs, ...decentralized.graphAccounts[1].subgraphs];
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
          const curatorSignals = sub.currentVersion.subgraphDeployment.curatorSignals;
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
          decenDepos[protocolType][name] = { network, schemaVersion, deploymentId, subgraphId, curatorSignals };
        } catch (err) {
          return;
        }
      });
      setDecentralizedDeployments(decenDepos);
    }
  }, [decentralized]);

  const navigate = useNavigate();
  window.scrollTo(0, 0);

  const decenDeposToSubgraphIds: any = {};
  if (Object.keys(decentralizedDeployments)?.length) {
    Object.keys(decentralizedDeployments).forEach((key) => {
      Object.keys(decentralizedDeployments[key]).forEach((x) => {
        const protocolObj = Object.keys(protocolsToQuery).find((pro) => pro.includes(x));
        if (protocolObj) {
          let networkStr = decentralizedDeployments[key][x]?.network;
          if (networkStr === "mainnet") {
            networkStr = "ethereum";
          }
          if (networkStr === "matic") {
            networkStr = "polygon";
          }
          let hasValidSignals = false;
          let signalCount = 0;
          decentralizedDeployments[key][x]?.curatorSignals?.forEach((x: any) => signalCount += x?.signal);
          if (signalCount > 0) {
            hasValidSignals = true;
          }
          decenDeposToSubgraphIds[x + "-" + networkStr] = hasValidSignals;
        }
      });
    });
  }

  // counts section
  let devCountTable = null;
  if (!!showSubgraphCountTable) {
    devCountTable = <DevCountTable subgraphCounts={subgraphCounts} />;
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
          <Button variant="contained" color="primary" onClick={() => navigate("/development-status")}>
            Development Status Table
          </Button>
        </div>
        <div style={{ width: "100%", textAlign: "right", marginTop: "30px" }}>
          <Button variant="contained" color="primary" onClick={() => setShowSubgraphCountTable(!showSubgraphCountTable)}>
            {showSubgraphCountTable ? "Hide" : "Show"} Subgraph Count Table
          </Button>
        </div>
        {devCountTable}
        <Typography variant="h3" align="center" sx={{ my: 4 }}>
          Deployed Subgraphs
        </Typography>
        <DeploymentsTable getData={() => getData()} protocolsToQuery={protocolsToQuery} decenDeposToSubgraphIds={decenDeposToSubgraphIds} />
      </DeploymentsLayout>
    </DeploymentsContextProvider >
  );
}

export default DeploymentsPage;