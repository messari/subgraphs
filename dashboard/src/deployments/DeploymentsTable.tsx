import { Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { SubgraphLogo } from "../common/SubgraphLogo";
import { NetworkLogo } from "../common/NetworkLogo";
import { useNavigate } from "react-router";
import DeploymentsInDevelopmentRow from "./DeploymentsInDevelopmentRow";
import ProtocolRow from "./ProtocolRow";
import { useMemo } from "react";
import { NewClient, schemaMapping } from "../utils";

interface DeploymentsTable {
    protocolsToQuery: { [x: string]: any };
    getData: any;
    decenDeposToSubgraphIds: { [x: string]: string };
}

function DeploymentsTable({ protocolsToQuery, getData, decenDeposToSubgraphIds }: DeploymentsTable) {

    // can receive protocolsToQuery or subgraph endpoints. subgraph endpoints is the old retired structure
    // Update to only use new protocolsToQueryStructure

    const navigate = useNavigate();
    const clientIndexing = useMemo(() => NewClient("https://api.thegraph.com/index-node/graphql"), []);

    if (Object.keys(protocolsToQuery).length === 0) {
        getData();
        return null;
    }
    const columnLabels: string[] = [
        "Name",
        "",
        "Network",
        "Indexed %",
        "Start Block",
        "Current Block",
        "Chain Head",
        "Schema",
        "Subgraph",
        "Entity Count",
    ];

    const tableHead = (
        <TableHead sx={{ height: "20px" }}>
            <TableRow sx={{ height: "20px" }}>
                {columnLabels.map((x, idx) => {
                    let textAlign = "left";
                    let paddingLeft = "0px";
                    let minWidth = "auto"
                    let maxWidth = "auto";
                    if (idx > 2) {
                        textAlign = "right";
                        paddingLeft = "16px";
                    }
                    if (idx === 0) {
                        minWidth = "300px";
                        maxWidth = "300px";
                    }
                    return (
                        <TableCell sx={{ paddingLeft, minWidth, maxWidth }} key={"column" + x}>
                            <Typography variant="h5" fontSize={14} fontWeight={500} sx={{ margin: "0", width: "100%", textAlign }}>
                                {x}
                            </Typography>
                        </TableCell>
                    );
                })}
            </TableRow>
        </TableHead>
    );
    let totalDepoCounter = 0;
    let protocolsInProgressCount = 0;
    let protocolsProdReadyCount = 0;
    const deposInProgress: { [x: string]: any } = {};
    Object.entries(protocolsToQuery).forEach(([protocolName, protocol]) => {
        Object.keys(protocol.deployments).forEach((depoKey) => {
            totalDepoCounter += 1;
            const deploymentData: any = protocol.deployments[depoKey];
            // Defeault status column in table is prod, when at least one depo on protocol is dev, the whoel row is dev
            if (!Object.keys(deposInProgress).includes(protocol.schema)) {
                deposInProgress[protocol.schema] = {};
            }
            if (!Object.keys(deposInProgress[protocol.schema]).includes(protocolName)) {
                deposInProgress[protocol.schema][protocolName] = { status: true, schemaVersions: [], subgraphVersions: [], methodologyVersions: [], networks: [] };
            }
            deposInProgress[protocol.schema][protocolName].networks.push({ deploymentName: depoKey, chain: deploymentData.network, status: deploymentData?.status, versions: deploymentData?.versions, hostedServiceId: deploymentData["deployment-ids"]["hosted-service"], decentralizedNetworkId: deploymentData["deployment-ids"]["decentralized-network"] || null });
            if (!deposInProgress[protocol.schema][protocolName]?.methodologyVersions?.includes(deploymentData?.versions?.methodology)) {
                deposInProgress[protocol.schema][protocolName]?.methodologyVersions?.push(deploymentData?.versions?.methodology);
            }
            if (!deposInProgress[protocol.schema][protocolName]?.subgraphVersions?.includes(deploymentData?.versions?.subgraph)) {
                deposInProgress[protocol.schema][protocolName]?.subgraphVersions?.push(deploymentData?.versions?.subgraph);
            }
            if (!deposInProgress[protocol.schema][protocolName]?.schemaVersions?.includes(deploymentData?.versions?.schema)) {
                deposInProgress[protocol.schema][protocolName]?.schemaVersions?.push(deploymentData?.versions?.schema);
            }
            if (deploymentData?.status === 'dev') {
                deposInProgress[protocol.schema][protocolName].status = false;
            }
        });
        if (deposInProgress[protocol.schema][protocolName].status === false) {
            protocolsInProgressCount += 1;
        } else {
            protocolsProdReadyCount += 1;
        }

    });

    return (
        <>
            {Object.entries(deposInProgress).sort().map(([schemaType, subgraph]) => {
                if (!Object.keys(schemaMapping).includes(schemaType)) {
                    return null;
                } else {
                    schemaType = schemaMapping[schemaType];
                }
                const tableRows = Object.keys(subgraph).sort().map((subgraphName) => {
                    const protocol = subgraph[subgraphName];
                    return (<ProtocolRow subgraphName={subgraphName} protocol={protocol} clientIndexing={clientIndexing} decenDeposToSubgraphIds={decenDeposToSubgraphIds} />);
                });
                return (
                    <TableContainer>
                        <Typography
                            key={"typography-" + schemaType}
                            variant="h4"
                            align="left"
                            fontWeight={500}
                            fontSize={28}
                            sx={{ padding: "6px", my: 2 }}
                        >
                            {schemaType.toUpperCase()}
                        </Typography>
                        <Table stickyHeader>
                            {tableHead}
                            <TableBody>{tableRows}</TableBody>
                        </Table>
                    </TableContainer>
                )
            })}
        </>
    );
}

export default DeploymentsTable;