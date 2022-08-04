import { styled } from "../styled";
import { useNavigate } from "react-router";
import { SearchInput } from "../common/utilComponents/SearchInput";
import { DeploymentsContextProvider } from "./DeploymentsContextProvider";
import { Typography } from "@mui/material";
import { NewClient } from "../utils";
import { useEffect, useMemo, useState } from "react";
import DeploymentsTable from "./DeploymentsTable";
import { useQuery } from "@apollo/client";
import { decentralizedNetworkSubgraphsQuery } from "../queries/decentralizedNetworkSubgraphsQuery";

const DeploymentsLayout = styled("div")`
  padding: 0;
`;

function DeploymentsPage() {
  const [ProtocolsToQuery, setProtocolsToQuery] = useState<{
    [type: string]: { [proto: string]: { [network: string]: string } };
  }>({});
  const getData = () => {
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

  const [decentralizedDeployments, setDecentralizedDeployments] = useState<{
    [type: string]: { [proto: string]: { [network: string]: string } };
  }>({})

  const clientDecentralizedEndpoint = useMemo(() => NewClient("https://api.thegraph.com/subgraphs/name/graphprotocol/graph-network-mainnet"), []);
  const { data: decentralized, error: decentralizedQueryError, loading: decentralizedQueryLoading } = useQuery(decentralizedNetworkSubgraphsQuery, {
    client: clientDecentralizedEndpoint,
  });

  useEffect(() => {
    getData();
  }, []);


  useEffect(() => {
    if (decentralized && !Object.keys(decentralizedDeployments)?.length) {
      const decenDepos: { [x: string]: any } = { exchanges: {}, lending: {}, vaults: {}, generic: {} }
      const subs = decentralized.graphAccount.subgraphs;
      subs.forEach((sub: any, idx: number) => {
        let name = sub.currentVersion.subgraphDeployment.originalName.toLowerCase().split(" ");
        name.pop();
        name = name.join("-");
        const network = sub.currentVersion.subgraphDeployment.network.id;
        const deploymentId = sub.currentVersion.subgraphDeployment.ipfsHash;
        const subgraphId = sub.id;
        const schemaVersion = sub.currentVersion.subgraphDeployment.schema.split("\n").join("").split("#").find((x: string[]) => x.includes("Version:")).split("Version:")[1].trim()
        const protocolTypeRaw = sub.currentVersion.subgraphDeployment.schema.split("\n").join("").split("#").find((x: string[]) => x.includes("Subgraph Schema:")).split("Subgraph Schema:")[1].trim();
        let protocolType = "generic";
        if (protocolTypeRaw.toUpperCase().includes("LEND")) {
          protocolType = "lending";
        } else if (protocolTypeRaw.toUpperCase().includes("EXCHANGE") || protocolTypeRaw.toUpperCase().includes("DEX")) {
          protocolType = "exchanges";
        } else if (protocolTypeRaw.toUpperCase().includes("VAULT") || protocolTypeRaw.toUpperCase().includes("YIELD")) {
          protocolType = "vaults";
        }
        decenDepos[protocolType][name] = { network, schemaVersion, deploymentId, subgraphId }
      })
      setDecentralizedDeployments(decenDepos);
    }
  }, [decentralized])

  const navigate = useNavigate();
  const clientIndexing = useMemo(() => NewClient("https://api.thegraph.com/index-node/graphql"), []);
  window.scrollTo(0, 0);

  let decentralizedSubgraphTable = null;
  if (Object.keys(decentralizedDeployments)?.length) {
    decentralizedSubgraphTable = Object.keys(decentralizedDeployments).map(key => (
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
          protocolsOnType={decentralizedDeployments[key]}
          protocolType={key}
          isDecentralizedNetworkTable={true}
        />
      </>
    ))
    decentralizedSubgraphTable.unshift(<Typography variant="h4" align="center" sx={{ my: 4 }}>Decentralized Network Subgraphs</Typography>);
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
        {decentralizedSubgraphTable}
        <Typography variant="h4" align="center" sx={{ my: 4 }}>
          Hosted Service Subgraphs
        </Typography>
        {Object.keys(ProtocolsToQuery).map((key) => {
          // map through Obj.keys of decentralizedDeployments[key], split them by space and lowercase. Then map through obj.keys of ProtocolsToQuery[key] and see if a similar key is found in both
          // if (decentralizedDeployments[key]) {
          //   Object.keys(decentralizedDeployments[key]).forEach(depo => {
          //     const keyArr = depo.split("-")
          //     const protocol = Object.keys(ProtocolsToQuery[key]).find(x => x.includes(keyArr[0]))
          //   })
          // }
          // const allProtocolsOnKey = { ...ProtocolsToQuery[key], ...decentralizedDeployments[key] }
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
                protocolsOnType={ProtocolsToQuery[key]}
                protocolType={key}
                isDecentralizedNetworkTable={false}
              />
            </>
          )
        })}
      </DeploymentsLayout>
    </DeploymentsContextProvider>
  );
}

export default DeploymentsPage;
