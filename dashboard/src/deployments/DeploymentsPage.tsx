import { styled } from "../styled";
import { useNavigate } from "react-router";
import { SearchInput } from "../common/utilComponents/SearchInput";
import { DeploymentsContextProvider } from "./DeploymentsContextProvider";
import { Typography } from "@mui/material";
import { useEffect, useState } from "react";
import DeploymentsTable from "./DeploymentsTable";
import DevCountTable from "./DevCountTable";

const DeploymentsLayout = styled("div")`
  padding: 0;
`;

interface DeploymentsPageProps {
  protocolsToQuery: { [x: string]: any };
  loading: boolean;
  getData: any;
  subgraphCounts: any;
  decentralizedDeployments: any;
  issuesMapping: any;
}

function DeploymentsPage({
  protocolsToQuery,
  loading,
  getData,
  subgraphCounts,
  decentralizedDeployments,
  issuesMapping,
}: DeploymentsPageProps) {
  const [showSubgraphCountTable, setShowSubgraphCountTable] = useState<boolean>(false);

  const [substreamsBasedSubgraphs, setSubstreamsBasedSubgraphs] = useState<{
    [type: string]: { [proto: string]: { [network: string]: string } };
  }>({});
  const [nonSubstreamsBasedSubgraphs, setNonSubstreamsBasedSubgraphs] = useState<{
    [type: string]: { [proto: string]: { [network: string]: string } };
  }>({});
  const [showSubstreamsBasedSubgraphs, setShowSubstreamsBasedSubgraphs] = useState<boolean>(false);

  useEffect(() => {
    if (!protocolsToQuery || Object.keys(protocolsToQuery).length === 0) {
      getData();
    }
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
            subgraphIdToMap = {
              id: item.subgraphId,
              signal: item.signalledTokens,
            };
            decenDeposToSubgraphIds[key + "-" + networkStr] = subgraphIdToMap;
          }
        });
      }
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
        {loading ? (
          <div
            className="loader-container"
            style={{
              width: "100%",
              height: "100vh",
              position: "fixed",
              zIndex: 1001,
              background:
                "transparent url('https://media.giphy.com/media/8agqybiK5LW8qrG3vJ/giphy.gif') center no-repeat",
            }}
          ></div>
        ) : (
          <DeploymentsTable
            getData={() => getData()}
            issuesMapping={issuesMapping}
            protocolsToQuery={showSubstreamsBasedSubgraphs ? substreamsBasedSubgraphs : nonSubstreamsBasedSubgraphs}
            decenDeposToSubgraphIds={decenDeposToSubgraphIds}
          />
        )}
      </DeploymentsLayout>
    </DeploymentsContextProvider>
  );
}

export default DeploymentsPage;
