import { SubgraphDeployments } from "./SubgraphDeployments";
import { ApolloClient, NormalizedCacheObject } from "@apollo/client";

interface DeploymentsTable {
    clientIndexing: ApolloClient<NormalizedCacheObject>;
    protocolsOnType: any;
    protocolType: string
}

function DeploymentsTable({
    protocolsOnType,
    clientIndexing,
    protocolType
}: DeploymentsTable) {
    // Key is label, value is flex ratio
    const labels: { [x: string]: number } = { "Name/Network": 4, "Indexed %": 2, "Current Block": 2, "Chain Head": 2, "Schema Version": 1, "Subgraph Version": 1, "Non-Fatal Errors": 1, "Entity Count": 2 }
    return (<>
        <div style={{ display: "flex", width: "100%", justifyContent: "space-around" }}>
            {Object.keys(labels).map(x => {
                const flexStr: string = labels[x].toString()
                return <h4 style={{ fontSize: "13px", flex: flexStr, textAlign: "left", margin: "3px", width: "100%" }}>{x}</h4>
            })}
        </div>
        <div style={{ borderLeft: "white 1px solid", borderRight: "white 1px solid", borderRadius: "8px" }}>
            {Object.keys(protocolsOnType).map((protocol) => {
                return (
                    <SubgraphDeployments
                        clientIndexing={clientIndexing}
                        key={protocolType + "-" + protocol}
                        protocol={{ name: protocol, deploymentMap: protocolsOnType[protocol] }}
                    />
                )
            })}
        </div></>
    );
}

export default DeploymentsTable;
