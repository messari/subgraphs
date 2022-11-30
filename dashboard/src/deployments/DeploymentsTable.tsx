import { Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import ProtocolSection from "./ProtocolSection";
import { useEffect, useMemo, useState } from "react";
import { NewClient, schemaMapping } from "../utils";
import FetchEntityCSV from "./FetchEntityCSV";
import JSZip from "jszip";

interface DeploymentsTable {
    protocolsToQuery: { [x: string]: any };
    issuesMapping: any;
    getData: any;
    decenDeposToSubgraphIds: { [x: string]: any };
    indexingStatusLoaded: any;
    indexingStatusLoadedPending: any;
    indexingStatusError: any;
    indexingStatusErrorPending: any;
}

function DeploymentsTable({ protocolsToQuery, issuesMapping, getData, decenDeposToSubgraphIds, indexingStatusLoaded, indexingStatusLoadedPending, indexingStatusError, indexingStatusErrorPending }: DeploymentsTable) {
    const clientIndexing = useMemo(() => NewClient("https://api.thegraph.com/index-node/graphql"), []);
    const [tableExpanded, setTableExpanded] = useState<any>({ lending: false, exchanges: false, vaults: false, generic: false, erc20: false, erc721: false, governance: false, network: false, ["nft-marketplace"]: false });
    const [generateEntityCSV, triggerGenerateEntityCSV] = useState<string>("");
    const [resultsObject, setResultsObject] = useState<any>({});

    useEffect(() => {
        if (generateEntityCSV.length > 0) {
            let depoCount = 0;
            Object.entries(protocolsToQuery).forEach(([protocolName, protocol]) => {
                if (schemaMapping[protocol.schema] !== schemaMapping[generateEntityCSV]) {
                    return;
                }
                Object.keys(protocol.deployments).forEach((depoKey) => {
                    const deploymentData: any = protocol.deployments[depoKey];
                    if (deploymentData?.services) {
                        if (!!deploymentData["services"]["hosted-service"] || !!deploymentData["services"]["decentralized-network"] || !!deploymentData["services"]["cronos-portal"]) {
                            depoCount += 1;
                        }
                    }
                });
            });
            if (resultsObject) {
                if (Object.keys(resultsObject).length >= depoCount) {
                    let zip = new JSZip();
                    Object.values(resultsObject).forEach((depo: any) => {
                        if (depo?.blob) {
                            zip.file(depo.filename, depo.blob);
                        }
                    });
                    zip.generateAsync({ type: "base64" }).then(function (content) {
                        const link = document.createElement('a');
                        link.download = "charts.zip";
                        link.href = "data:application/zip;base64," + content;
                        link.click()
                        triggerGenerateEntityCSV("");
                    });
                }
            }
        }
    }, [resultsObject])

    if (Object.keys(protocolsToQuery).length === 0) {
        getData();
        return null;
    }
    const columnLabels: any = {
        "Name": "300px",
        "": "45px",
        "Network": "420px",
        "Status": "40px",
        "Indexed %": "auto",
        "Start Block": "auto",
        "Current Block": "auto",
        "Chain Head": "auto",
        "Schema": "auto",
        "Subgraph": "auto",
        "Entity Count": "auto",
    };

    const tableHead = (
        <TableHead sx={{ height: "20px" }}>
            <TableRow sx={{ height: "20px" }}>
                {Object.keys(columnLabels).map((x, idx) => {
                    let textAlign = "left";
                    let paddingLeft = "0px";
                    let minWidth = columnLabels[x];
                    let maxWidth = columnLabels[x];
                    if (idx > 2) {
                        textAlign = "right";
                        paddingLeft = "16px";
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
                let validationSupported = true;
                if (!Object.keys(schemaMapping).includes(schemaType)) {
                    validationSupported = false;
                } else {
                    schemaType = schemaMapping[schemaType];
                }
                const isLoaded = indexingStatusLoaded[schemaType];
                const isLoadedPending = indexingStatusLoadedPending[schemaType];
                const indexQueryError = indexingStatusError[schemaType];
                const indexQueryErrorPending = indexingStatusErrorPending[schemaType];
                const tableRows = Object.keys(subgraph).sort().map((subgraphName) => {
                    const protocol = subgraph[subgraphName];
                    let csvGenerationComponents = null;
                    if (schemaMapping[generateEntityCSV] === schemaMapping[schemaType] && generateEntityCSV?.length > 0) {
                        csvGenerationComponents = protocol.networks.map((depo: any) => {
                            return (
                                <FetchEntityCSV
                                    entityName="financialsDailySnapshots"
                                    deployment={depo.deploymentName}
                                    protocolType={schemaType.toUpperCase()}
                                    schemaVersion={depo.versions.schema}
                                    timestampLt={1000000000000000000}
                                    timestampGt={0}
                                    queryURL={`https://api.thegraph.com/subgraphs/name/messari/${depo.hostedServiceId}`}
                                    resultsObject={resultsObject}
                                    setResultsObject={setResultsObject}
                                />)
                        })
                    }
                    return (<>
                        {csvGenerationComponents}
                        <ProtocolSection
                            key={"ProtocolSection-" + subgraphName.toUpperCase() + '-' + schemaType}
                            issuesMapping={issuesMapping}
                            subgraphName={subgraphName}
                            protocol={protocol}
                            schemaType={schemaType}
                            clientIndexing={clientIndexing}
                            decenDeposToSubgraphIds={decenDeposToSubgraphIds}
                            tableExpanded={tableExpanded[schemaType]}
                            validationSupported={validationSupported}
                            isLoaded={isLoaded}
                            isLoadedPending={isLoadedPending}
                            indexQueryError={indexQueryError}
                            indexQueryErrorPending={indexQueryErrorPending}
                        /></>);
                });
                return (
                    <TableContainer sx={{ my: 8 }} key={"TableContainer-" + schemaType.toUpperCase()}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <Typography
                                key={"typography-Title-" + schemaType}
                                variant="h4"
                                align="left"
                                fontWeight={500}
                                fontSize={28}
                                sx={{ padding: "6px", my: 2 }}
                            >
                                {schemaType.toUpperCase()}
                            </Typography>
                            <Typography
                                key={"typography-toggle-" + schemaType}
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
                        {schemaMapping[schemaType] ? (<div style={{ display: "block", paddingLeft: "5px", textAlign: "left", color: "white" }} className="Hover-Underline MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium MuiButtonBase-root  css-1huqmjz-MuiButtonBase-root-MuiButton-root" onClick={() => {
                            triggerGenerateEntityCSV(schemaType.toUpperCase())
                        }} >Get Bulk FinancialsDailySnapshots CSV</div>) : null}

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