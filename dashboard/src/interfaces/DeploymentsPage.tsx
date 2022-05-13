import { ApolloClient, HttpLink, InMemoryCache, NormalizedCacheObject, useQuery } from "@apollo/client";
import { Box, Button, TextField } from "@mui/material";
import React, { useMemo, useState } from "react";
import { isValidHttpUrl, parseSubgraphName } from "../utils";
import { ProtocolsToQuery } from "../constants";
import { SubgraphStatusQuery } from "../queries/subgraphStatusQuery";
import { SubgraphDeployments } from "../common/subgraphDeployments";
import { SubgraphStatus } from "../types";
import { useNavigate } from "react-router";

// async function FetchProtocolMetadata(
//   setMetadata: React.Dispatch<React.SetStateAction<ApolloQueryResult<any>[]>>,
//   fatalErrorDeployments: string[],
// ): Promise<any> {
//   const queries: Promise<ApolloQueryResult<any>>[] = [];
//   const protocolQuery = gql`
//     {
//       protocols {
//         type
//         schemaVersion
//         subgraphVersion
//         name
//         id
//       }
//       _meta {
//         deployment
//       }
//     }
//   `;
//   try {
//     for (let protocol of Object.keys(ProtocolsToQuery)) {
//       for (let network of Object.keys(ProtocolsToQuery[protocol])) {
//         if (fatalErrorDeployments.includes(ProtocolsToQuery[protocol][network].deploymentId)) {
//           continue;
//         }
//         const clientReturned = NewClient(ProtocolsToQuery[protocol][network].URL);
//         const clientQuery = clientReturned.query({ query: protocolQuery });
//         // Need to further research how to effective handle apollo client errors, particularly in a promise loop
//         clientQuery.catch((err) => {
//           console.log("ERRRRR", ProtocolsToQuery[protocol][network].deploymentId);
//           return err;
//         });
//         queries.push(clientQuery);
//       }
//     }
//     setMetadata(await Promise.all(queries));
//   } catch (err) {
//     console.log("CATCH ERR FETCHING PROTOCOL METADATA", err);
//   }
//   return Promise.resolve();
// }

function DeploymentsPage() {
  const [urlText, setUrlText] = useState<string>("");
  const navigate = useNavigate();
  // const [metadata, setMetadata] = useState<ApolloQueryResult<any>[]>([]);
  // const allDeployments: { [x: string]: string }[] = [];

  const deploymentIdsArray: string[] = [];
  Object.keys(ProtocolsToQuery).forEach((protocol) => {
    // If a protocol in the ProtocolsToQuery object does not have a valid deployment id, it will return null and not be returned as a protocol on the deployments page
    Object.keys(ProtocolsToQuery[protocol]).forEach((network) => {
      const currentDeployObj: { [x: string]: string } = ProtocolsToQuery[protocol][network];
      deploymentIdsArray.push(currentDeployObj.deploymentId);
      // currentDeployObj.name = protocol;
      // currentDeployObj.network = network;
      // allDeployments.push(currentDeployObj);
      // deploymentIdsArray.push(currentDeployObj.deploymentId);
    });
  });
  const link = new HttpLink({
    uri: "https://api.thegraph.com/index-node/graphql",
  });
  const client = useMemo(
    () =>
      new ApolloClient({
        link,
        cache: new InMemoryCache(),
      }),
    [],
  );

  const { data: subgraphStatusList, error } = useQuery(SubgraphStatusQuery, {
    variables: { deploymentIds: deploymentIdsArray },
    client,
  });
  const subgraphStatusMap = useMemo<Record<string, SubgraphStatus>>(() => {
    if (!subgraphStatusList) return {};
    return subgraphStatusList.indexingStatuses.reduce(
      (acc: Record<string, SubgraphStatus>, status: SubgraphStatus) => ({
        ...acc,
        [status.subgraph]: {
          ...status,
          network: status.chains[0]?.network ?? "",
        },
      }),
      {},
    );
  }, [subgraphStatusList]);
  //
  // const fatalErrorDeployments: string[] = [];
  // const deploymentErrorMsgs: string[] = [];
  // let errorRender = null;
  //
  // try {
  //   if (subgraphStatusList?.indexingStatuses) {
  //     allDeployments.forEach((deploy) => {
  //       const id = deploy.deploymentId;
  //       const subgraphPulled = subgraphStatusList.indexingStatuses.find((status: { [x: string]: any }) => {
  //         return status.subgraph === id;
  //       });
  //       console.log(deploy, subgraphPulled);
  //       if (!subgraphPulled) {
  //         fatalErrorDeployments.push(id);
  //         deploymentErrorMsgs.push(
  //           deploy.name.toUpperCase() +
  //             " - " +
  //             deploy.network.toUpperCase() +
  //             " provided deployment id " +
  //             id +
  //             " is not the current deployment. Please update constants file.",
  //         );
  //       } else if (subgraphPulled?.fatalError) {
  //         fatalErrorDeployments.push(id);
  //       }
  //     });
  //     if (deploymentErrorMsgs.length > 0) {
  //       const newErrObj = new ApolloError({ errorMessage: deploymentErrorMsgs.join("---") });
  //       errorRender = ErrorDisplay(newErrObj, selectSubgraph, {}, { url: "", version: "" });
  //     }
  //   }
  //   if (metadata.length === 0) {
  //     FetchProtocolMetadata(setMetadata, fatalErrorDeployments);
  //   }
  //
  //   // NEED TO CHANGE HOW DEPLOYMENT ID IS MAPPED HERE
  //   const metadataArr = metadata.map((q) => {
  //     return { ...q.data.protocols[0], deploymentId: q.data._meta.deployment };
  //   });
  //
  //   let RenderAll = null;
  //
  //   if (subgraphStatusList?.indexingStatuses?.length > 0) {
  //     // const sortedStatusList = subgraphStatusList.indexingStatuses.map(
  //     const subgraphListByProtocol: { [x: string]: { [x: string]: any }[] } = {};
  //     subgraphStatusList.indexingStatuses.forEach((subgraph: { [x: string]: any }, idx: number) => {
  //       const currentProtocolName = allDeployments.find((x) => {
  //         return x.deploymentId === subgraph.subgraph;
  //       })?.name;
  //       const currentProtocolData: { [x: string]: any } =
  //         allDeployments.find((x) => {
  //           return x.deploymentId === subgraph.subgraph;
  //         }) || {};
  //       const currentMetadata: { [x: string]: any } =
  //         metadataArr.find((obj) => {
  //           return obj.deploymentId === subgraph.subgraph;
  //         }) || {};
  //       // console.log('CHECK', currentMetadata, currentProtocolData, currentProtocolName)
  //       if (currentMetadata && currentProtocolData) {
  //         currentProtocolData.schemaVersion = currentMetadata?.schemaVersion || "0.0.0";
  //         currentProtocolData.subgraphVersion = currentMetadata?.subgraphVersion || "0.0.0";
  //         currentProtocolData.address = currentMetadata?.id || "0x0";
  //       }
  //
  //       let indexed = 0;
  //       if (subgraph.synced) {
  //         indexed = 100;
  //       } else {
  //         indexed = parseFloat(
  //           ((subgraph.chains[0].latestBlock.number / subgraph.chains[0].chainHeadBlock.number) * 100).toFixed(2),
  //         );
  //       }
  //       currentProtocolData.subgraph = subgraph;
  //       currentProtocolData.indexed = indexed;
  //       if (!subgraphListByProtocol[currentProtocolName || idx]) {
  //         subgraphListByProtocol[currentProtocolName || idx] = [];
  //       }
  //       subgraphListByProtocol[currentProtocolName || idx].push(currentProtocolData);
  //     });
  //   }

  return (
    <div className="DeploymentsPage">
      <Box marginLeft={6} marginTop={1} marginRight={6}>
        <TextField
          label="Subgraph query name ie. messari/balancer-v2-ethereum"
          fullWidth
          onChange={(event) => {
            setUrlText(event.target.value);
          }}
        />
        <Button
          style={{ border: "black 0.2px solid", marginTop: "10px" }}
          onClick={() => {
            // if (!isValidHttpUrl(urlText)) {
            //   // If the provided URL is not a valid Http URL, set a manual error
            //   return;
            // }

            navigate(`graphs?subgraph=${urlText}`);
          }}
        >
          Load Subgraph
        </Button>
      </Box>
      <h2 style={{ textAlign: "center" }}>Deployed Subgraphs</h2>
      {/*{errorRender}*/}
      {Object.keys(ProtocolsToQuery).map((key) => (
        <SubgraphDeployments
          key={key}
          protocol={{ name: key, deploymentMap: ProtocolsToQuery[key] }}
          statusMap={subgraphStatusMap}
        />
      ))}
    </div>
  );
  // } catch (err) {
  //   if (err instanceof Error) {
  //     console.log("CATCH,", Object.keys(err), Object.values(err), err);
  //     return <h3>JAVASCRIPT ERROR {err.message}</h3>;
  //   } else {
  //     return <h3>JAVASCRIPT ERROR</h3>;
  //   }
  // }
}

export default DeploymentsPage;