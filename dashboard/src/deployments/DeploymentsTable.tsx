import { Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import ProtocolSection from "./ProtocolSection";
import { useMemo, useState } from "react";
import { NewClient, schemaMapping } from "../utils";

interface DeploymentsTable {
    protocolsToQuery: { [x: string]: any };
    getData: any;
    decenDeposToSubgraphIds: { [x: string]: string };
    indexingStatusLoaded: any;
    indexingStatusLoadedPending: any;
    indexingStatusError: any;
    indexingStatusErrorPending: any;
}

function DeploymentsTable({ protocolsToQuery, getData, decenDeposToSubgraphIds, indexingStatusLoaded, indexingStatusLoadedPending, indexingStatusError, indexingStatusErrorPending }: DeploymentsTable) {
    const clientIndexing = useMemo(() => NewClient("https://api.thegraph.com/index-node/graphql"), []);
    const [tableExpanded, setTableExpanded] = useState<any>({ lending: true, exchanges: true, vaults: true, generic: true });
    if (Object.keys(protocolsToQuery).length === 0) {
        getData();
        return null;
    }
    const columnLabels: string[] = [
        "Name",
        "",
        "Network",
        "Status",
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

    const deposToPass: { [x: string]: any } = {};
    Object.entries(protocolsToQuery).forEach(([protocolName, protocol]) => {
        Object.keys(protocol.deployments).forEach((depoKey) => {
            const deploymentData: any = protocol.deployments[depoKey];
            if (!deploymentData?.services) {
                return;
            }
            if (!!deploymentData["services"]["hosted-service"] || !!deploymentData["services"]["decentralized-network"] || !!deploymentData["services"]["cronos-portal"]) {
                if (!Object.keys(deposToPass).includes(protocol.schema)) {
                    deposToPass[protocol.schema] = {};
                }
                if (!Object.keys(deposToPass[protocol.schema]).includes(protocolName)) {
                    deposToPass[protocol.schema][protocolName] = { status: true, schemaVersions: [], subgraphVersions: [], methodologyVersions: [], networks: [] };
                }
                let decentralizedNetworkId = null;
                if (!!deploymentData["services"]["decentralized-network"]) {
                    decentralizedNetworkId = deploymentData["services"]["decentralized-network"]["slug"];
                }
                let hostedServiceId = null;
                if (!!deploymentData["services"]["hosted-service"]) {
                    hostedServiceId = deploymentData["services"]["hosted-service"]["slug"];
                }
                if (!!deploymentData["services"]["cronos-portal"]) {
                    hostedServiceId = deploymentData["services"]["cronos-portal"]["slug"];
                }
                deposToPass[protocol.schema][protocolName].networks.push({ deploymentName: depoKey, chain: deploymentData.network, indexStatus: deploymentData?.indexStatus, pendingIndexStatus: deploymentData?.pendingIndexStatus, status: deploymentData?.status, versions: deploymentData?.versions, hostedServiceId, decentralizedNetworkId });
                if (!deposToPass[protocol.schema][protocolName]?.methodologyVersions?.includes(deploymentData?.versions?.methodology)) {
                    deposToPass[protocol.schema][protocolName]?.methodologyVersions?.push(deploymentData?.versions?.methodology);
                }
                if (!deposToPass[protocol.schema][protocolName]?.subgraphVersions?.includes(deploymentData?.versions?.subgraph)) {
                    deposToPass[protocol.schema][protocolName]?.subgraphVersions?.push(deploymentData?.versions?.subgraph);
                }
                if (!deposToPass[protocol.schema][protocolName]?.schemaVersions?.includes(deploymentData?.versions?.schema)) {
                    deposToPass[protocol.schema][protocolName]?.schemaVersions?.push(deploymentData?.versions?.schema);
                }
                if (deploymentData?.status === 'dev') {
                    deposToPass[protocol.schema][protocolName].status = false;
                }
            }
        });
    });

    return (
        <>
            {Object.entries(deposToPass).sort().map(([schemaType, subgraph]) => {
                if (!Object.keys(schemaMapping).includes(schemaType)) {
                    return null;
                } else {
                    schemaType = schemaMapping[schemaType];
                }
                const isLoaded = indexingStatusLoaded[schemaType];
                const isLoadedPending = indexingStatusLoadedPending[schemaType];
                const indexQueryError = indexingStatusError[schemaType];
                const indexQueryErrorPending = indexingStatusErrorPending[schemaType];
                const tableRows = Object.keys(subgraph).sort().map((subgraphName) => {
                    const protocol = subgraph[subgraphName];
                    return (
                        <ProtocolSection
                            key={"ProtocolSection-" + subgraphName.toUpperCase()}
                            subgraphName={subgraphName}
                            protocol={protocol}
                            clientIndexing={clientIndexing}
                            decenDeposToSubgraphIds={decenDeposToSubgraphIds}
                            tableExpanded={tableExpanded[schemaType]}
                            isLoaded={isLoaded}
                            isLoadedPending={isLoadedPending}
                            indexQueryError={indexQueryError}
                            indexQueryErrorPending={indexQueryErrorPending}
                        />);
                });
                return (
                    <TableContainer sx={{ my: 8 }} key={"TableContainer-" + schemaType.toUpperCase()}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
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
                            <Typography
                                key={"typography-" + schemaType}
                                variant="h4"
                                align="left"
                                fontWeight={500}
                                fontSize={18}
                                sx={{ padding: "6px", my: 2 }}
                            >
                                <span style={{ color: "white", cursor: "pointer", margin: "4px" }} onClick={() => setTableExpanded({ ...tableExpanded, [schemaType]: !tableExpanded[schemaType] })}>
                                    <u>{tableExpanded[schemaType] ? "Collapse" : "Expand"} Table</u>
                                </span>
                            </Typography>
                        </div>
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