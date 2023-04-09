import { Button, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import ProtocolSection from "./ProtocolSection";
import { useEffect, useMemo, useState } from "react";
import { downloadCSV, NewClient, schemaMapping } from "../utils";
import FetchEntityCSV from "./FetchEntityCSV";
import { MultiSelectDropDown } from "../common/utilComponents/MultiSelectDropDown";
import { DateRangePicker } from "../common/utilComponents/DateRangePicker";
import moment from "moment";

interface DeploymentsTable {
    protocolsToQuery: { [x: string]: any };
    issuesMapping: any;
    getData: any;
    decenDepoIndexingStatus: any;
    decenDeposToSubgraphIds: { [x: string]: any };
    indexingStatusLoaded: any;
    indexingStatusLoadedPending: any;
    indexingStatusError: any;
    indexingStatusErrorPending: any;
}

function DeploymentsTable({ protocolsToQuery, issuesMapping, getData, decenDepoIndexingStatus, decenDeposToSubgraphIds, indexingStatusLoaded, indexingStatusLoadedPending, indexingStatusError, indexingStatusErrorPending }: DeploymentsTable) {
    const clientIndexing = useMemo(() => NewClient("https://api.thegraph.com/index-node/graphql"), []);
    const [tableExpanded, setTableExpanded] = useState<any>({ lending: false, exchanges: false, vaults: false, generic: false, erc20: false, erc721: false, governance: false, network: false, ["nft-marketplace"]: false });
    const [generateEntityCSV, triggerGenerateEntityCSV] = useState<string>("");
    const [resultsObject, setResultsObject] = useState<any>({});
    const schemaDatesObject: any = {};
    const schemaBooleansObject: any = {};
    const schemaDeposSelected: any = {};
    const supportedSchemaTypes = Array.from(new Set(Object.values(schemaMapping)));
    supportedSchemaTypes.forEach((schema: string) => {
        schemaDatesObject[schema] = [];
        schemaDeposSelected[schema] = [];
        schemaBooleansObject[schema] = false;
    });
    const [deposSelected, setDeposSelected] = useState<any>({ ...schemaDeposSelected });
    const [dates, setDates] = useState<any>({ ...schemaDatesObject });
    const [showDatePicker, setShowDatePicker] = useState<any>({ ...schemaBooleansObject });

    useEffect(() => {
        setShowDatePicker({ ...schemaBooleansObject });
    }, [generateEntityCSV])

    useEffect(() => {
        if (generateEntityCSV.length > 0) {
            if (resultsObject) {
                if (deposSelected[schemaMapping[generateEntityCSV]].includes('All')) {
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
                    if ((Object.keys(resultsObject).length >= depoCount) && deposSelected[schemaMapping[generateEntityCSV]].length > 0) {
                        let fullJSON: any[] = [];
                        Object.values(resultsObject).forEach((depo: any) => {
                            if (Array.isArray(depo)) {
                                fullJSON = [...fullJSON, ...depo];
                            }
                        });
                        downloadCSV(fullJSON, `depoCount${Object.keys(resultsObject).length}`, generateEntityCSV);
                        setDates({ ...dates, [schemaMapping[generateEntityCSV]]: [] })
                        triggerGenerateEntityCSV("");
                        setResultsObject({});
                    }
                } else if ((Object.keys(resultsObject).length >= deposSelected[schemaMapping[generateEntityCSV]].length) && deposSelected[schemaMapping[generateEntityCSV]].length > 0) {
                    let fullJSON: any[] = [];
                    Object.values(resultsObject).forEach((depo: any) => {
                        if (Array.isArray(depo)) {
                            fullJSON = [...fullJSON, ...depo];
                        }
                    });
                    downloadCSV(fullJSON, `depoCount${Object.keys(resultsObject).length}`, generateEntityCSV);
                    setDates({ ...dates, [schemaMapping[generateEntityCSV]]: [] })
                    triggerGenerateEntityCSV("");
                    setResultsObject({});
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
                const validDeployments: string[] = [];
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
                    if (schemaMapping[schemaType]) {
                        csvGenerationComponents = protocol.networks.map((depo: any) => {
                            if (schemaMapping[generateEntityCSV] === schemaMapping[schemaType] && generateEntityCSV?.length > 0 && (deposSelected[schemaMapping[schemaType]].includes(depo.deploymentName) || deposSelected[schemaMapping[schemaType]].includes("All"))) {
                                let timestampLt = 10000000000000;
                                if (dates[schemaMapping[schemaType]].length > 1) {
                                    timestampLt = moment.utc(dates[schemaMapping[schemaType]][1]).unix();
                                }
                                let timestampGt = 0;
                                if (dates[schemaMapping[schemaType]].length > 0) {
                                    timestampGt = moment.utc(dates[schemaMapping[schemaType]][0]).unix();
                                }
                                return (
                                    <FetchEntityCSV
                                        entityName="financialsDailySnapshots"
                                        deployment={depo.deploymentName}
                                        protocolType={schemaType.toUpperCase()}
                                        schemaVersion={depo.versions.schema}
                                        timestampLt={timestampLt}
                                        timestampGt={timestampGt}
                                        queryURL={`https://api.thegraph.com/subgraphs/name/messari/${depo.hostedServiceId}`}
                                        resultsObject={resultsObject}
                                        setResultsObject={setResultsObject}
                                    />)
                            } else if (depo.status === 'prod') {
                                validDeployments.push(depo.deploymentName);
                                return null;
                            } else {
                                return null;
                            }
                        })
                    }
                    const decenDepoData: any = {};
                    Object.keys(decenDepoIndexingStatus).forEach(x => {
                        if (x.includes(subgraphName) || !!(protocol.networks.find((x: any) => x.deploymentName.includes(subgraphName)))) {
                            decenDepoData[x] = decenDepoIndexingStatus[x];
                        }
                    });

                    return (<>
                        {csvGenerationComponents}
                        <ProtocolSection
                            key={"ProtocolSection-" + subgraphName.toUpperCase() + '-' + schemaType}
                            issuesMapping={issuesMapping}
                            subgraphName={subgraphName}
                            protocol={protocol}
                            decenDepoData={decenDepoData}
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
                let executeDownloadCSV = null;
                if (deposSelected[schemaMapping[schemaType]]?.length > 0) {
                    executeDownloadCSV = (<>
                        <div style={{ display: "block", paddingLeft: "5px", textAlign: "left", color: "white", marginBottom: "10px", cursor: "pointer" }} className="Hover-Underline MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium MuiButtonBase-root  css-1huqmjz-MuiButtonBase-root-MuiButton-root" onClick={() => {
                            if (generateEntityCSV?.length > 0) {
                                return;
                            }
                            triggerGenerateEntityCSV(schemaType.toUpperCase())
                        }} >{generateEntityCSV?.length > 0 && schemaMapping[generateEntityCSV] === schemaMapping[schemaType] && !!schemaMapping[schemaType] ? <><CircularProgress size={15} /><span style={{ margin: "0 10px" }}>Loading CSVs...</span></> : "Get Bulk FinancialsDailySnapshots CSV"}</div>

                        <div style={{ position: "relative", zIndex: 1001 }}>
                            <Button className="Hover-Underline" onClick={(e) => {
                                e.stopPropagation();
                                setShowDatePicker({ ...showDatePicker, [schemaMapping[schemaType]]: !showDatePicker[schemaMapping[schemaType]] })
                            }}>
                                {dates[schemaMapping[schemaType]]?.length === 2 && !!schemaMapping[schemaType] ? `${dates[schemaMapping[schemaType]][0].format("M/D/YY")} - ${dates[schemaMapping[schemaType]][1].format("M/D/YY")}` : "Select Dates"}
                            </Button>
                            {showDatePicker[schemaMapping[schemaType]] && <DateRangePicker dates={dates[schemaMapping[schemaType]]} setDates={(x: any) => {
                                setDates({ ...dates, [schemaMapping[schemaType]]: x });
                                if (x?.length === 2) {
                                    setShowDatePicker({ ...showDatePicker, [schemaMapping[schemaType]]: false });
                                }
                            }} />}
                        </div>
                    </>);
                }
                let additionalStyles = {};
                if (showDatePicker[schemaMapping[schemaType]]) {
                    additionalStyles = { minHeight: "510px", overflow: "hidden" };
                }
                return (
                    <TableContainer sx={{ my: 8, ...additionalStyles }} key={"TableContainer-" + schemaType.toUpperCase()}>
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
                        {schemaMapping[schemaType] ? (<>
                            {executeDownloadCSV}
                            <MultiSelectDropDown optionsList={validDeployments} optionsSelected={deposSelected[schemaMapping[schemaType]]} setOptionsSelected={(x: any) => setDeposSelected({ ...deposSelected, [schemaMapping[schemaType]]: x })} label="Deployment Selection" />
                        </>) : null}
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