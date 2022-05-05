import { ApolloClient, ApolloQueryResult, gql, InMemoryCache, NormalizedCacheObject, useQuery } from "@apollo/client";
import { Box, Button, TextField } from "@mui/material";

import React, { useEffect, useMemo, useState } from "react";
import { isValidHttpUrl } from "../App";
import { ProtocolsToQuery } from "../constants";
import { SubgraphStatusQuery } from "../queries/subgraphStatusQuery";

function NewClient(url: string): ApolloClient<NormalizedCacheObject> {
  const client = new ApolloClient({
    uri: url,
    cache: new InMemoryCache()
  });
  return client;
}

async function FetchProtocolMetadata(setMetadata: React.Dispatch<React.SetStateAction<ApolloQueryResult<any>[]>>): Promise<any> {
  const queries: Promise<ApolloQueryResult<any>>[] = [];
  const protocolQuery = gql`
    {
      protocols {
        type
        schemaVersion
        subgraphVersion
        methodologyVersion
        name
        id
      }
    }
    `;
  
    for (let i of Object.keys(ProtocolsToQuery)) {    
      const clientReturned = NewClient(ProtocolsToQuery[i].URL);
      const clientQuery = clientReturned.query({query: protocolQuery});

      // Need to further research how to effective handle apollo client errors, particularly in a promise loop
      clientQuery.catch(err => {
        console.log(err)
        return err;
      })
      queries.push(clientQuery);
    }
    try {
      setMetadata(await Promise.all(queries));
    } catch (err) {
      console.log('CATCH ERR', err);
    }
    return (await Promise.all(queries));
  }
  
  function DeploymentsPage(selectSubgraph: React.Dispatch<React.SetStateAction<string>>, setTextField: React.Dispatch<React.SetStateAction<string>>, urlTextField: string) {
    const [metadata, setMetadata] = useState<ApolloQueryResult<any>[]>([])
    
    if (metadata.length === 0) {

      FetchProtocolMetadata(setMetadata)
    }
        
    const deploymentIdsArray = Object.keys(ProtocolsToQuery).map(pro => {
      // If a protocol in the ProtocolsToQuery object does not have a valid deployment id, it will return null and not be returned as a protocol on the deployments page
      return ProtocolsToQuery[pro].deploymentId;
    })
    const client = useMemo(
      () =>
        new ApolloClient({
          uri: 'https://api.thegraph.com/index-node/graphql',
          cache: new InMemoryCache()
        }),
      []);
      console.log(deploymentIdsArray)

      const { data: subgraphStatusList, error } = useQuery(SubgraphStatusQuery, {variables: {deploymentIds: (deploymentIdsArray)}, client });
                
      const metadataArr = metadata.map((q, idx) => { 
        return {...q.data.protocols[0], deploymentId: deploymentIdsArray[idx]}
      });

      console.log(metadataArr)
        let RenderAll = null
        
        if (subgraphStatusList?.indexingStatuses?.length > 0) {
          // const sortedStatusList = subgraphStatusList.indexingStatuses.map(
          RenderAll = (
            subgraphStatusList.indexingStatuses.map((subgraph: {[x: string]: any}) => {
              const currentProtocolName = Object.keys(ProtocolsToQuery).find(x => { return ProtocolsToQuery[x].deploymentId === subgraph.subgraph });
              const currentProtocolData: {[x:string]: any} | undefined = Object.values(ProtocolsToQuery).find(x => { return x.deploymentId === subgraph.subgraph });
              const currentMetadata: {[x:string]: any} | undefined = metadataArr.find(obj => { return obj.deploymentId === subgraph.subgraph});
              if (currentMetadata  && currentProtocolData) {
                currentProtocolData.schemaVersion = currentMetadata?.schemaVersion ||'0.0.0'
                currentProtocolData.subgraphVersion = currentMetadata?.subgraphVersion || "0.0.0"
                currentProtocolData.address = currentMetadata?.id || "0x0"
                console.log('subg', subgraph, 'metadata', currentMetadata)
              }
              let indexed = 0
              if (subgraph.synced) {
                indexed = 100
              } else {
                indexed = parseFloat((subgraph.chains[0].latestBlock.number / subgraph.chains[0].chainHeadBlock.number * 100).toFixed(2));
              }
              
              
            
              return (<div onClick={() => { currentProtocolData?.URL ? selectSubgraph(currentProtocolData?.URL): selectSubgraph("")}} style={{border: 'black 2px solid', margin: "18px 50px", cursor: "pointer"}}>
                  <h3>{currentProtocolName} - {currentProtocolData?.address || '0x0'}</h3>
                  <p>{currentProtocolData?.URL}</p>
                  <p>Entity count: {subgraph.entityCount}</p>
                  <p>Indexed: {indexed}% - {subgraph.fatalError ? (<span style={{color: 'red'}}>Fatal Error - Execution Stospanped at block {subgraph.chains[0].lastHealthyBlock.number}</span>)
                    : <span>Latest Block: {subgraph.chains[0].latestBlock.number}</span>}</p>
                  <p>Network: {subgraph.chains[0].network} - Current chain block: {subgraph.chains[0].chainHeadBlock.number}</p>
                  <p>Schema version: {currentProtocolData?.schemaVersion || '0.0.0'} - Subgraph version: {currentProtocolData?.subgraphVersion || '0.0.0'}</p>
                  <p>Non fatal error count: {subgraph.nonFatalErrors.length}</p>
                </div>
              );
            })
          )
        }

    
    // Upon initialization, query for all deployed subgraphs. Two queries
        // Map through Object.keys of ProtocolsToQuery and create an array of all deployment ids, query https://api.thegraph.com/index-node/graphql for indexingStatuses https://thegraph.com/docs/en/developer/quick-start/#5-check-your-logs
        // Map through Object.keys of ProtocolsToQuery and create an array of queries
    // Map all deployed subgraphs and create each section as a flexbox div (3 per line?)
        // Display all info about protocol and index status
  return (
    <div className="DeploymentsPage">
      <Box marginLeft={6} marginTop={1} marginRight={6}>
        <TextField
          label="Graph Url"
          fullWidth
          onChange={(event) => {
            setTextField(event.target.value)
          }}
        />
        <Button style={{border: "black 0.2px solid", marginTop: "10px"}} onClick={() => {
            if (!isValidHttpUrl(urlTextField)) {
              // If the provided URL is not a valid Http URL, set a manual error
              return;
            }
            selectSubgraph(urlTextField);
          }}>Show Graphs</Button>
      </Box>
      <h2 style={{textAlign: "center"}}>Deployed Subgraphs</h2>
      {RenderAll}
    </div>
  );
}

export default DeploymentsPage;