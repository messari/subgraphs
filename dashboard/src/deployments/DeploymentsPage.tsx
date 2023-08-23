import { styled } from "../styled";
import { useNavigate } from "react-router";
import { SearchInput } from "../common/utilComponents/SearchInput";
import { DeploymentsContextProvider } from "./DeploymentsContextProvider";
import { Typography } from "@mui/material";
import { useEffect, useState } from "react";
import DeploymentsTable from "./DeploymentsTable";
import DevCountTable from "./DevCountTable";
import IndexingCalls from "./IndexingCalls";
import DecenIndexingCalls from "./DecenIndexingCalls";

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
  decentralizedDeployments: any;
  issuesMapping: any;
}

function DeploymentsPage({
  protocolsToQuery,
  getData,
  subgraphCounts,
  indexingStatusQueries,
  endpointSlugs,
  aliasToProtocol,
  decentralizedDeployments,
  issuesMapping,
}: DeploymentsPageProps) {
  const [showSubgraphCountTable, setShowSubgraphCountTable] = useState<boolean>(false);

  const [indexingStatusLoaded, setIndexingStatusLoaded] = useState<any>({
    lending: false,
    exchanges: false,
    vaults: false,
    generic: false,
    bridge: false,
    erc20: false,
    erc721: false,
    governance: false,
    // network: false,
    ["nft-marketplace"]: false,
    ["derivatives-options"]: false,
    ["derivatives-perpfutures"]: false,
  });

  const [indexingStatusLoadedPending, setIndexingStatusLoadedPending] = useState<any>({
    lending: false,
    exchanges: false,
    vaults: false,
    generic: false,
    bridge: false,
    erc20: false,
    erc721: false,
    governance: false,
    // network: false,
    ["nft-marketplace"]: false,
    ["derivatives-options"]: false,
    ["derivatives-perpfutures"]: false,
  });

  const [indexingStatusError, setIndexingStatusError] = useState<any>({
    lending: false,
    exchanges: false,
    vaults: false,
    generic: false,
    bridge: false,
    erc20: false,
    erc721: false,
    governance: false,
    // network: false,
    ["nft-marketplace"]: false,
    ["derivatives-options"]: false,
    ["derivatives-perpfutures"]: false,
  });

  const [indexingStatusErrorPending, setIndexingStatusErrorPending] = useState<any>({
    lending: false,
    exchanges: false,
    vaults: false,
    generic: false,
    bridge: false,
    erc20: false,
    erc721: false,
    governance: false,
    // network: false,
    ["nft-marketplace"]: false,
    ["derivatives-options"]: false,
    ["derivatives-perpfutures"]: false,
  });

  const [decenDepoIndexingStatus, setDecenDepoIndexingStatus] = useState<boolean>(false);
  const [indexingStatus, setIndexingStatus] = useState<any>(false);
  const [pendingIndexingStatus, setPendingIndexingStatus] = useState<any>(false);

  const [substreamsBasedSubgraphs, setSubstreamsBasedSubgraphs] = useState<{
    [type: string]: { [proto: string]: { [network: string]: string } };
  }>({});
  const [nonSubstreamsBasedSubgraphs, setNonSubstreamsBasedSubgraphs] = useState<{
    [type: string]: { [proto: string]: { [network: string]: string } };
  }>({});
  const [showSubstreamsBasedSubgraphs, setShowSubstreamsBasedSubgraphs] = useState<boolean>(false);

  useEffect(() => {
    getData();
  }, []);

  useEffect(() => {
    let substreamsBasedSubgraphs: any = {};
    let nonSubstreamsBasedSubgraphs: any = {};
    Object.keys(protocolsToQuery).forEach((protocolName: string) => {
      const protocol: { [x: string]: any } = protocolsToQuery[protocolName];
      if (protocol.base === "substreams") {
        substreamsBasedSubgraphs[protocolName] = protocolsToQuery[protocolName];
      } else {
        nonSubstreamsBasedSubgraphs[protocolName] = protocolsToQuery[protocolName];
      }
    });
    setSubstreamsBasedSubgraphs(substreamsBasedSubgraphs);
    setNonSubstreamsBasedSubgraphs(nonSubstreamsBasedSubgraphs);
  }, [protocolsToQuery]);

  const navigate = useNavigate();
  window.scrollTo(0, 0);

  const decenDeposToSubgraphIds: any = {};
  const depoIdToSubgraphName: any = {};
  const depoIds: any = [];
  let decentralizedDepoQuery: any = "";

  if (Object.keys(decentralizedDeployments)?.length) {
    Object.keys(decentralizedDeployments).forEach((key) => {
      const protocolObj = Object.keys(protocolsToQuery).find((pro) => pro.includes(key));
      if (protocolObj) {
        decentralizedDeployments[key].forEach((item: any) => {
          if (item.signalledTokens > 0) {
            let networkStr = item.network;
            if (networkStr === "mainnet") {
              networkStr = "ethereum";
            }
            if (networkStr === "matic") {
              networkStr = "polygon";
            }
            if (networkStr === "arbitrum-one") {
              networkStr = "arbitrum";
            }
            let subgraphIdToMap = { id: "", signal: 0 };
            depoIdToSubgraphName[item.deploymentId] =
              (protocolsToQuery[protocolObj]?.protocol || protocolObj) + "-" + networkStr;
            depoIds.push(item.deploymentId);
            subgraphIdToMap = {
              id: item.subgraphId,
              signal: item.signalledTokens,
            };
            decenDeposToSubgraphIds[key + "-" + networkStr] = subgraphIdToMap;
          }
        });
      }
    });

    const subgraphIdString = JSON.stringify(depoIds);
    decentralizedDepoQuery = `query Status { indexingStatuses(subgraphs: ${subgraphIdString} ) { 
          subgraph
          synced
          fatalError {
            message
          }
          chains {
            chainHeadBlock {
              number
            }
            earliestBlock {
              number
            }
            latestBlock {
              number
            }
            lastHealthyBlock {
              number
            }
          }
          entityCount
      }
  }`;
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
      />
    );
  }
  let decenIndexingCalls = null;
  if (decentralizedDepoQuery?.length > 0) {
    decenIndexingCalls = (
      <DecenIndexingCalls
        setDepoIndexingStatus={setDecenDepoIndexingStatus}
        decentralizedDepoQuery={decentralizedDepoQuery}
        depoIdToSubgraphName={depoIdToSubgraphName}
      />
    );
  }

  if (!!indexingStatus) {
    Object.keys(indexingStatus).forEach((depo: string) => {
      let deploymentStr = depo.split("_").join("-");
      if (protocolsToQuery[aliasToProtocol[depo]]) {
        if (!!protocolsToQuery[aliasToProtocol[depo]].deployments[deploymentStr]) {
          protocolsToQuery[aliasToProtocol[depo]].deployments[deploymentStr].indexStatus = indexingStatus[depo];
        } else {
          if (depo.includes("erc") || depo.includes("governance")) {
            deploymentStr += "-ethereum";
          }
          const network = deploymentStr.split("-").pop() || "";
          const depoKey =
            Object.keys(protocolsToQuery[aliasToProtocol[depo]].deployments).find((x: any) => {
              return protocolsToQuery[aliasToProtocol[depo]].deployments[x].network === network;
            }) || "";
          if (!protocolsToQuery[aliasToProtocol[depo]].deployments[depoKey]) {
            return;
          }
          protocolsToQuery[aliasToProtocol[depo]].deployments[depoKey].indexStatus = indexingStatus[depo];
        }
      }
    });
  }

  if (!!pendingIndexingStatus) {
    Object.keys(pendingIndexingStatus).forEach((depo: string) => {
      if (!pendingIndexingStatus[depo]) {
        return;
      }
      const depoNoPendingArr = depo.split("_");
      depoNoPendingArr.pop();
      const deploymentStr = depoNoPendingArr.join("-");
      if (protocolsToQuery[aliasToProtocol[depoNoPendingArr.join("_")]]) {
        if (!!protocolsToQuery[aliasToProtocol[depoNoPendingArr.join("_")]].deployments[deploymentStr]) {
          protocolsToQuery[aliasToProtocol[depoNoPendingArr.join("_")]].deployments[deploymentStr].pendingIndexStatus =
            pendingIndexingStatus[depo];
        }
      }
    });
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
        <div style={{ width: "100%", textAlign: "center" }}>
          <span
            style={{
              width: "0",
              flex: "1 1 0",
              textAlign: "center",
              marginTop: "0",
              borderRight: "#6656F8 2px solid",
              padding: "0 30px",
            }}
            className="Menu-Options"
            onClick={() => setShowSubgraphCountTable(!showSubgraphCountTable)}
          >
            {showSubgraphCountTable ? "Hide" : "Show"} Subgraph Count Table
          </span>
          <span
            style={{
              width: "0",
              flex: "1 1 0",
              textAlign: "center",
              marginTop: "0",
              borderRight: "#6656F8 2px solid",
              padding: "0 30px",
            }}
            className="Menu-Options"
            onClick={() => navigate("protocols-list")}
          >
            Protocols To Develop
          </span>
          <span
            style={{ padding: "0 30px", borderRight: "#6656F8 2px solid" }}
            className="Menu-Options"
            onClick={() => navigate("version-comparison")}
          >
            Version Comparison
          </span>
          <span
            style={{ padding: "0 30px" }}
            className="Menu-Options"
            onClick={() => {
              setShowSubstreamsBasedSubgraphs(!showSubstreamsBasedSubgraphs);
            }}
          >
            Show {showSubstreamsBasedSubgraphs ? "Non" : ""} Substreams Based Subgraphs
          </span>
        </div>
        {devCountTable}
        <DeploymentsTable
          getData={() => getData()}
          decenDepoIndexingStatus={decenDepoIndexingStatus}
          issuesMapping={issuesMapping}
          protocolsToQuery={showSubstreamsBasedSubgraphs ? substreamsBasedSubgraphs : nonSubstreamsBasedSubgraphs}
          decenDeposToSubgraphIds={decenDeposToSubgraphIds}
          indexingStatusLoaded={indexingStatusLoaded}
          indexingStatusLoadedPending={indexingStatusLoadedPending}
          indexingStatusError={indexingStatusError}
          indexingStatusErrorPending={indexingStatusErrorPending}
        />
      </DeploymentsLayout>
      {decenIndexingCalls}
      {indexingCalls}
    </DeploymentsContextProvider>
  );
}

export default DeploymentsPage;
