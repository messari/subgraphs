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
import IndexingCalls from "./IndexingCalls";

const DeploymentsLayout = styled("div")`
  padding: 0;
`;

interface DeploymentsPageProps {
  protocolsToQuery: { [x: string]: any };
  getData: any;
  subgraphCounts: any;
  indexingStatusQueries: any;
  endpointSlugs: string[];
  aliasToProtocol: any;
}

function DeploymentsPage({ protocolsToQuery, getData, subgraphCounts, indexingStatusQueries, endpointSlugs, aliasToProtocol }: DeploymentsPageProps) {
  const [decentralizedDeployments, setDecentralizedDeployments] = useState<{
    [type: string]: { [network: string]: any };
  }>({});

  const [showSubgraphCountTable, setShowSubgraphCountTable] = useState<boolean>(false);

  const [indexingStatusLoaded, setIndexingStatusLoaded] = useState<any>({ lending: false, exchanges: false, vaults: false, generic: false, erc20: false, erc721: false, governance: false, network: false, ["nft-marketplace"]: false });
  const [indexingStatusLoadedPending, setIndexingStatusLoadedPending] = useState<any>({ lending: false, exchanges: false, vaults: false, generic: false, erc20: false, erc721: false, governance: false, network: false, ["nft-marketplace"]: false });

  const [indexingStatusError, setIndexingStatusError] = useState<any>({ lending: false, exchanges: false, vaults: false, generic: false, erc20: false, erc721: false, governance: false, network: false, ["nft-marketplace"]: false });
  const [indexingStatusErrorPending, setIndexingStatusErrorPending] = useState<any>({ lending: false, exchanges: false, vaults: false, generic: false, erc20: false, erc721: false, governance: false, network: false, ["nft-marketplace"]: false });

  const [indexingStatus, setIndexingStatus] = useState<any>(false);
  const [pendingIndexingStatus, setPendingIndexingStatus] = useState<any>(false);
  const clientIndexing = useMemo(() => NewClient("https://api.thegraph.com/index-node/graphql"), []);

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
      const decenDepos: { [x: string]: any } = {};
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
          const signalledTokens = sub.currentVersion.subgraphDeployment.signalledTokens;
          const subgraphId = sub.id;
          decenDepos[name] = { network, deploymentId, subgraphId, signalledTokens };
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
    Object.keys(decentralizedDeployments).forEach((x) => {
      const protocolObj = Object.keys(protocolsToQuery).find((pro) => pro.includes(x));
      if (protocolObj) {
        let networkStr = decentralizedDeployments[x]?.network;
        if (networkStr === "mainnet") {
          networkStr = "ethereum";
        }
        if (networkStr === "matic") {
          networkStr = "polygon";
        }
        let subgraphIdToMap = { id: "", signal: 0 };
        if (decentralizedDeployments[x]?.signalledTokens > 0) {
          subgraphIdToMap = { id: decentralizedDeployments[x]?.subgraphId, signal: decentralizedDeployments[x]?.signalledTokens };
        }
        decenDeposToSubgraphIds[x + "-" + networkStr] = subgraphIdToMap;
      }
    });
  }

  // counts section
  let devCountTable = null;
  if (!!showSubgraphCountTable) {
    devCountTable = <DevCountTable subgraphCounts={subgraphCounts} />;
  }

  let indexingCalls = null;
  if (endpointSlugs.length > 0) {
    indexingCalls = (
      <IndexingCalls
        setIndexingStatus={setIndexingStatus}
        setPendingIndexingStatus={setPendingIndexingStatus}
        indexingStatusQueries={indexingStatusQueries}
        setIndexingStatusLoaded={setIndexingStatusLoaded}
        setIndexingStatusLoadedPending={setIndexingStatusLoadedPending}
        setIndexingStatusError={setIndexingStatusError}
        setIndexingStatusErrorPending={setIndexingStatusErrorPending}
        indexingStatusLoaded={indexingStatusLoaded}
        indexingStatusLoadedPending={indexingStatusLoadedPending}
        indexingStatusError={indexingStatusError}
        indexingStatusErrorPending={indexingStatusErrorPending}
      />)
  }

  if (!!indexingStatus) {
    Object.keys(indexingStatus).forEach((depo: string) => {
      let deploymentStr = depo.split("_").join("-");
      if (protocolsToQuery[aliasToProtocol[depo]]) {
        if (!!protocolsToQuery[aliasToProtocol[depo]].deployments[deploymentStr]) {
          protocolsToQuery[aliasToProtocol[depo]].deployments[deploymentStr].indexStatus = indexingStatus[depo];
        } else {
          if (depo.includes('erc') || depo.includes('governance')) {
            deploymentStr += '-ethereum';
          }
          const network = deploymentStr.split("-").pop() || "";
          const depoKey = (Object.keys(protocolsToQuery[aliasToProtocol[depo]].deployments).find((x: any) => {
            return protocolsToQuery[aliasToProtocol[depo]].deployments[x].network === network
          }) || "");
          if (!protocolsToQuery[aliasToProtocol[depo]].deployments[depoKey]) {
            return;
          }
          protocolsToQuery[aliasToProtocol[depo]].deployments[depoKey].indexStatus = indexingStatus[depo];
        }
      }
    })
  }

  if (!!pendingIndexingStatus) {
    Object.keys(pendingIndexingStatus).forEach((depo: string) => {
      if (!pendingIndexingStatus[depo]) {
        return;
      }
      const depoNoPendingArr = depo.split("_");
      depoNoPendingArr.pop()
      const deploymentStr = depoNoPendingArr.join("-");
      if (protocolsToQuery[aliasToProtocol[depoNoPendingArr.join("_")]]) {
        if (!!protocolsToQuery[aliasToProtocol[depoNoPendingArr.join("_")]].deployments[deploymentStr]) {
          protocolsToQuery[aliasToProtocol[depoNoPendingArr.join("_")]].deployments[deploymentStr].pendingIndexStatus = pendingIndexingStatus[depo];
        }
      }
    })
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
        <Typography variant="h3" align="center" sx={{ my: 5 }}>
          Deployed Subgraphs
        </Typography>
        <div style={{ display: "flex", width: "55%", marginLeft: "23%" }}>
          <div style={{ width: "100%", textAlign: "center", marginTop: "0", borderRight: "#6656F8 2px solid" }}>
            <span className="Menu-Options" onClick={() => navigate("/comparison")}>
              DefiLlama Comparison
            </span>
          </div>
          <div style={{ width: "100%", textAlign: "center", marginTop: "0", borderLeft: "#6656F8 2px solid", borderRight: "#6656F8 2px solid", paddingLeft: "16px" }}>
            <span className="Menu-Options" onClick={() => setShowSubgraphCountTable(!showSubgraphCountTable)}>
              {showSubgraphCountTable ? "Hide" : "Show"} Subgraph Count Table
            </span>
          </div>
          <div style={{ width: "100%", textAlign: "center", marginTop: "0", borderLeft: "#6656F8 2px solid" }}>
            <span className="Menu-Options" onClick={() => navigate("protocols-list")}>
              Protocols To Develop
            </span>
          </div>
        </div>
        {devCountTable}
        <DeploymentsTable
          getData={() => getData()}
          protocolsToQuery={protocolsToQuery}
          decenDeposToSubgraphIds={decenDeposToSubgraphIds}
          indexingStatusLoaded={indexingStatusLoaded}
          indexingStatusLoadedPending={indexingStatusLoadedPending}
          indexingStatusError={indexingStatusError}
          indexingStatusErrorPending={indexingStatusErrorPending}
        />
      </DeploymentsLayout>
      {indexingCalls}
    </DeploymentsContextProvider >
  );
}

export default DeploymentsPage;