import { CircularProgress, TableCell, TableRow, Tooltip, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { NetworkLogo } from "../common/NetworkLogo";
import { SubgraphLogo } from "../common/SubgraphLogo";
import { latestSchemaVersions } from "../constants";
import { convertTokenDecimals, formatIntToFixed2, toPercent } from "../utils";

interface ProtocolSection {
    protocol: { [x: string]: any };
    subgraphName: string;
    clientIndexing: any;
    decenDeposToSubgraphIds: { [x: string]: any };
    tableExpanded: boolean;
    isLoaded: boolean;
    isLoadedPending: boolean;
    indexQueryError: boolean;
    indexQueryErrorPending: boolean;
    validationSupported: boolean;
}

function ProtocolSection({ protocol, subgraphName, clientIndexing, decenDeposToSubgraphIds, tableExpanded, isLoaded, isLoadedPending, validationSupported, indexQueryError, indexQueryErrorPending }: ProtocolSection) {
    const [showDeposDropDown, toggleShowDeposDropDown] = useState<boolean>(false);
    const navigate = useNavigate();

    useEffect(() => {
        toggleShowDeposDropDown(tableExpanded);
    }, [tableExpanded])

    let hasDecentralizedDepo = false;
    protocol.networks.forEach((depo: any) => {
        if (!!Object.keys(decenDeposToSubgraphIds)?.includes(depo?.decentralizedNetworkId) || !!Object.keys(decenDeposToSubgraphIds)?.includes(depo?.hostedServiceId)) {
            hasDecentralizedDepo = true;
        }
    })

    if (showDeposDropDown) {
        const depoRowsOnProtocol = protocol.networks.map((depo: any) => {
            let chainLabel = depo.chain;
            if (protocol.networks.filter((x: any) => x.chain === depo.chain).length > 1) {
                chainLabel = depo.deploymentName;
            }
            let pendingRow = null;
            if (!!depo?.pendingIndexStatus) {
                const pendingObject = depo!.pendingIndexStatus;
                let syncedPending = pendingObject?.synced ? pendingObject?.synced : {};
                let statusPendingDataOnChain: { [x: string]: any } = {};
                if (pendingObject?.chains?.length > 0) {
                    statusPendingDataOnChain = pendingObject?.chains[0];
                }

                let highlightColor = "#B8301C";
                if (!pendingObject?.fatalError) {
                    highlightColor = "#EFCB68";
                }

                let indexedPending = formatIntToFixed2(toPercent(
                    statusPendingDataOnChain?.latestBlock?.number - statusPendingDataOnChain?.earliestBlock?.number || 0,
                    statusPendingDataOnChain?.chainHeadBlock?.number - statusPendingDataOnChain?.earliestBlock?.number,
                ));

                if (syncedPending && !pendingObject?.fatalError && Number(indexedPending) > 99) {
                    highlightColor = "#58BC82";
                    indexedPending = formatIntToFixed2(100);
                }

                let schemaCell = <span>{depo?.versions?.schema}</span>;

                if (!depo?.versions?.schema || !latestSchemaVersions.includes(depo?.versions?.schema)) {
                    schemaCell = <Tooltip title="This deployment does not have the latest schema verison" placement="top" ><span style={{ color: "#FFA500" }}>{depo?.versions?.schema || "N/A"}</span></Tooltip>
                }

                if (!isLoadedPending) {
                    pendingRow = (
                        <TableRow onClick={(event) => {
                            if (event.ctrlKey) {
                                if (!validationSupported) {
                                    window.open("https://thegraph.com/hosted-service/subgraph/messari/" + depo.hostedServiceId + "?version=pending", "_blank");
                                    return;
                                }
                                if (!pendingObject?.fatalError) {
                                    window.open(`https://subgraphs.messari.io/subgraph?endpoint=messari/${depo.hostedServiceId}&tab=protocol&version=pending`, "_blank");
                                } else {
                                    window.open("https://okgraph.xyz/?q=" + pendingObject?.subgraph, "_blank");
                                }
                            } else {
                                if (!validationSupported) {
                                    window.location.href = "https://thegraph.com/hosted-service/subgraph/messari/" + depo.hostedServiceId + "?version=pending";
                                    return;
                                }
                                if (!pendingObject?.fatalError) {
                                    navigate(`subgraph?endpoint=messari/${depo.hostedServiceId}&tab=protocol&version=pending`)
                                } else {
                                    window.location.href = "https://okgraph.xyz/?q=" + pendingObject?.subgraph;
                                }
                            }
                        }
                        } key={subgraphName + depo.hostedServiceId + "DepInDevRow-PENDING"} sx={{ height: "10px", width: "100%", backgroundColor: "rgba(22,24,29,0.9)", cursor: "pointer" }}>
                            <TableCell
                                sx={{ backgroundColor: "rgb(55, 55, 55)", color: "white", padding: "0", paddingLeft: "6px", borderLeft: `${highlightColor} solid 34px`, verticalAlign: "middle", display: "flex" }}
                            >
                                <SubgraphLogo name={subgraphName} size={30} />
                                <span style={{ display: "inline-flex", alignItems: "center", padding: "0px 10px", fontSize: "14px" }}>
                                    {chainLabel} (PENDING)
                                </span>
                            </TableCell>
                            <TableCell sx={{ backgroundColor: "rgb(55, 55, 55)", padding: "0", paddingRight: "16px", textAlign: "right" }}>

                            </TableCell>
                            <TableCell sx={{ backgroundColor: "rgb(55, 55, 55)", color: "white", padding: "0 16px 0 30px", textAlign: "right", display: "flex" }}>
                                <NetworkLogo tooltip={depo.chain} key={subgraphName + depo.chain + 'Logo-PENDING'} size={30} network={depo.chain} />
                            </TableCell>
                            <TableCell sx={{ backgroundColor: "rgb(55, 55, 55)", color: "white", padding: "0", paddingRight: "16px", textAlign: "right" }}>
                                {depo?.status === "prod" ? <img src="https://images.emojiterra.com/twitter/v13.1/512px/2705.png" height="24px" width="24px" /> : <img src="https://github.githubassets.com/images/icons/emoji/unicode/1f6e0.png" height="24px" width="24px" />}
                            </TableCell>
                            <TableCell sx={{ backgroundColor: "rgb(55, 55, 55)", color: "white", padding: "0", paddingRight: "16px", textAlign: "right" }}>
                                <CircularProgress size={20} />
                            </TableCell>
                            <TableCell sx={{ backgroundColor: "rgb(55, 55, 55)", color: "white", padding: "0", paddingRight: "16px", textAlign: "right" }}>
                                <CircularProgress size={20} />
                            </TableCell>
                            <TableCell sx={{ backgroundColor: "rgb(55, 55, 55)", color: "white", padding: "0", paddingRight: "16px", textAlign: "right" }}>
                                <CircularProgress size={20} />
                            </TableCell>
                            <TableCell sx={{ backgroundColor: "rgb(55, 55, 55)", color: "white", padding: "0", paddingRight: "16px", textAlign: "right" }}>
                                <CircularProgress size={20} />
                            </TableCell>
                            <TableCell sx={{ backgroundColor: "rgb(55, 55, 55)", color: "white", padding: "0", paddingRight: "16px", textAlign: "right" }}>
                                <Typography variant="h5" sx={{ width: "100%" }} fontSize={14}>
                                    {schemaCell}
                                </Typography>
                            </TableCell>
                            <TableCell sx={{ backgroundColor: "rgb(55, 55, 55)", color: "white", padding: "0", paddingRight: "16px", textAlign: "right" }}>
                                <Typography variant="h5" sx={{ width: "100%" }} fontSize={14}>
                                    {depo?.versions?.subgraph || "N/A"}
                                </Typography>
                            </TableCell>

                            <TableCell sx={{ backgroundColor: "rgb(55, 55, 55)", color: "white", padding: "0", paddingRight: "16px", textAlign: "right" }}>
                                <Typography variant="h5" sx={{ width: "100%" }} fontSize={14}>
                                    <CircularProgress size={20} />
                                </Typography>
                            </TableCell>
                        </TableRow>
                    )
                } else {
                    pendingRow = (
                        <TableRow onClick={(event) => {
                            if (event.ctrlKey) {
                                if (!validationSupported) {
                                    window.open("https://thegraph.com/hosted-service/subgraph/messari/" + depo.hostedServiceId + "?version=pending", "_blank");
                                    return;
                                }
                                if (!pendingObject?.fatalError) {
                                    window.open(`https://subgraphs.messari.io/subgraph?endpoint=messari/${depo.hostedServiceId}&tab=protocol&version=pending`, "_blank");
                                } else {
                                    window.open("https://okgraph.xyz/?q=" + pendingObject?.subgraph, "_blank");
                                }
                            } else {
                                if (!validationSupported) {
                                    window.location.href = "https://thegraph.com/hosted-service/subgraph/messari/" + depo.hostedServiceId + "?version=pending";
                                    return;
                                }
                                if (!pendingObject?.fatalError) {
                                    navigate(`subgraph?endpoint=messari/${depo.hostedServiceId}&tab=protocol&version=pending`);
                                } else {
                                    window.location.href = "https://okgraph.xyz/?q=" + pendingObject?.subgraph;
                                }
                            }
                        }} key={subgraphName + depo.hostedServiceId + "DepInDevRow-PENDING"} sx={{ height: "10px", width: "100%", backgroundColor: "rgba(22,24,29,0.9)", cursor: "pointer" }}>
                            <TableCell
                                sx={{ backgroundColor: "rgb(55, 55, 55)", color: "white", padding: "0", paddingLeft: "6px", borderLeft: `${highlightColor} solid 34px`, verticalAlign: "middle", display: "flex" }}
                            >
                                <SubgraphLogo name={subgraphName} size={30} />
                                <span style={{ display: "inline-flex", alignItems: "center", padding: "0px 10px", fontSize: "14px" }}>
                                    {chainLabel} (PENDING)
                                </span>
                            </TableCell>
                            <TableCell sx={{ backgroundColor: "rgb(55, 55, 55)", padding: "0", paddingRight: "16px", textAlign: "right" }}>

                            </TableCell>
                            <TableCell sx={{ backgroundColor: "rgb(55, 55, 55)", color: "white", padding: "0 16px 0 30px", textAlign: "right", display: "flex" }}>
                                <NetworkLogo tooltip={depo.chain} key={subgraphName + depo.chain + 'Logo-PENDING'} size={30} network={depo.chain} />
                            </TableCell>
                            <TableCell sx={{ backgroundColor: "rgb(55, 55, 55)", color: "white", padding: "0", paddingRight: "16px", textAlign: "right" }}>
                                {depo?.status === "prod" ? <img src="https://images.emojiterra.com/twitter/v13.1/512px/2705.png" height="24px" width="24px" /> : <img src="https://github.githubassets.com/images/icons/emoji/unicode/1f6e0.png" height="24px" width="24px" />}
                            </TableCell>
                            <TableCell sx={{ backgroundColor: "rgb(55, 55, 55)", color: "white", padding: "0", paddingRight: "16px", textAlign: "right" }}>
                                {indexedPending ? indexedPending + "%" : "N/A"}
                            </TableCell>
                            <TableCell sx={{ backgroundColor: "rgb(55, 55, 55)", color: "white", padding: "0", paddingRight: "16px", textAlign: "right" }}>
                                {!!Number(statusPendingDataOnChain?.earliestBlock?.number) ? Number(statusPendingDataOnChain?.earliestBlock?.number)?.toLocaleString() : "N/A"}
                            </TableCell>
                            <TableCell sx={{ backgroundColor: "rgb(55, 55, 55)", color: "white", padding: "0", paddingRight: "16px", textAlign: "right" }}>
                                {!!Number(statusPendingDataOnChain?.latestBlock?.number) ? Number(statusPendingDataOnChain?.latestBlock?.number)?.toLocaleString() : "N/A"}
                            </TableCell>
                            <TableCell sx={{ backgroundColor: "rgb(55, 55, 55)", color: "white", padding: "0", paddingRight: "16px", textAlign: "right" }}>
                                {!!Number(statusPendingDataOnChain?.chainHeadBlock?.number) ? Number(statusPendingDataOnChain?.chainHeadBlock?.number)?.toLocaleString() : "N/A"}
                            </TableCell>
                            <TableCell sx={{ backgroundColor: "rgb(55, 55, 55)", color: "white", padding: "0", paddingRight: "16px", textAlign: "right" }}>
                                <Typography variant="h5" sx={{ width: "100%" }} fontSize={14}>
                                    {schemaCell}
                                </Typography>
                            </TableCell>
                            <TableCell sx={{ backgroundColor: "rgb(55, 55, 55)", color: "white", padding: "0", paddingRight: "16px", textAlign: "right" }}>
                                <Typography variant="h5" sx={{ width: "100%" }} fontSize={14}>
                                    {depo?.versions?.subgraph || "N/A"}
                                </Typography>
                            </TableCell>

                            <TableCell sx={{ backgroundColor: "rgb(55, 55, 55)", color: "white", padding: "0", paddingRight: "16px", textAlign: "right" }}>
                                <Typography variant="h5" sx={{ width: "100%" }} fontSize={14}>
                                    {parseInt(pendingObject?.entityCount) ? parseInt(pendingObject?.entityCount)?.toLocaleString() : "N/A"}
                                </Typography>
                            </TableCell>
                        </TableRow>
                    );
                }
            }
            let decenRow = null;
            if (!!Object.keys(decenDeposToSubgraphIds)?.includes(depo?.decentralizedNetworkId) || !!Object.keys(decenDeposToSubgraphIds)?.includes(depo?.hostedServiceId)) {
                const decenObject = depo?.indexStatus;
                let syncedDecen = decenObject?.synced ?? {};
                let statusDecenDataOnChain: { [x: string]: any } = {};
                if (decenObject?.chains?.length > 0) {
                    statusDecenDataOnChain = decenObject?.chains[0];
                }

                let highlightColor = "#B8301C";
                if (!decenObject?.fatalError) {
                    highlightColor = "#EFCB68";
                }

                let indexedDecen = formatIntToFixed2(toPercent(
                    statusDecenDataOnChain?.latestBlock?.number - statusDecenDataOnChain?.earliestBlock?.number || 0,
                    statusDecenDataOnChain?.chainHeadBlock?.number - statusDecenDataOnChain?.earliestBlock?.number,
                ));

                if (syncedDecen && !decenObject?.fatalError && Number(indexedDecen) > 99) {
                    highlightColor = "#58BC82";
                    indexedDecen = formatIntToFixed2(100);
                }

                const decenSubgraphKey = Object.keys(decenDeposToSubgraphIds)?.find(x => x.includes(subgraphName));
                let decenSubgraphId = decenObject?.subgraph;
                if (decenSubgraphKey) {
                    decenSubgraphId = decenDeposToSubgraphIds[decenSubgraphKey]?.id;
                }
                let endpointURL =
                    "https://gateway.thegraph.com/api/" + process.env.REACT_APP_GRAPH_API_KEY + "/subgraphs/id/" + decenSubgraphId;

                let schemaCell = <span>{depo?.versions?.schema}</span>;

                if (!depo?.versions?.schema || !latestSchemaVersions.includes(depo?.versions?.schema)) {
                    schemaCell = <Tooltip title="This deployment does not have the latest schema version" placement="top" ><span style={{ color: "#FFA500" }}>{depo?.versions?.schema || "N/A"}</span></Tooltip>
                }
                let decenDeposBySubgraphId = decenDeposToSubgraphIds[depo?.decentralizedNetworkId];
                if (!decenDeposBySubgraphId) {
                    decenDeposBySubgraphId = decenDeposToSubgraphIds[depo?.hostedServiceId];
                }

                let curationElement = null;
                if (!decenDeposBySubgraphId?.id) {
                    curationElement = (
                        <span style={{ display: "inline-flex", alignItems: "center", padding: "0px 10px", fontSize: "10px" }}>
                            <Tooltip title="No curation on this Subgraph" placement="top" ><span style={{ padding: "0 5px", borderRadius: "50%", color: "#B8301C", border: "#B8301C 1.5px solid", cursor: "default", fontWeight: "800" }}>!</span></Tooltip>
                        </span>
                    );
                } else if (decenDeposBySubgraphId?.signal > 0) {
                    let convertedSignalAmount = convertTokenDecimals(decenDeposBySubgraphId?.signal, 21).toFixed(1);
                    curationElement = (
                        <span style={{ display: "inline-flex", alignItems: "center", padding: "0px 10px", fontSize: "14px" }}>
                            <Tooltip title="Current Curation Signal" placement="top" ><span style={{ padding: "0", cursor: "default", fontWeight: "800" }}>{convertedSignalAmount}K GRT</span></Tooltip>
                        </span>
                    );
                }
                decenRow = (
                    <TableRow onClick={(event) => {
                        if (event.ctrlKey) {
                            if (!validationSupported) {
                                window.open(`https://thegraph.com/explorer/subgraph?id=${decenSubgraphId}&view=Overview`, "_blank");
                                return;
                            }
                            if (!decenObject?.fatalError) {
                                window.open(`https://subgraphs.messari.io/subgraph?endpoint=${endpointURL}&tab=protocol`, "_blank");
                            } else {
                                window.open("https://okgraph.xyz/?q=" + depo.decentralizedNetworkId, "_blank");
                            }
                        } else {
                            if (!validationSupported) {
                                window.location.href = `https://thegraph.com/explorer/subgraph?id=${decenSubgraphId}&view=Overview`;
                                return;
                            }
                            if (!decenObject?.fatalError) {
                                navigate(`subgraph?endpoint=${endpointURL}&tab=protocol`)
                            } else {
                                window.location.href = "https://okgraph.xyz/?q=" + depo.decentralizedNetworkId;
                            }
                        }
                        return;
                    }} key={subgraphName + depo.hostedServiceId + "DepInDevRow-DECEN"} sx={{ height: "10px", width: "100%", backgroundColor: "rgba(22,24,29,0.9)", cursor: "pointer" }}>
                        <TableCell
                            sx={{ backgroundColor: "rgb(55, 55, 55)", color: "white", padding: "0", paddingLeft: "6px", borderLeft: `${highlightColor} solid 34px`, verticalAlign: "middle", display: "flex" }}
                        >
                            <SubgraphLogo name={subgraphName} size={30} />
                            <span style={{ display: "inline-flex", alignItems: "center", padding: "0px 10px", fontSize: "14px" }}>
                                {chainLabel}
                            </span>
                            <span style={{ display: "inline-flex", alignItems: "center", padding: "0px 10px", fontSize: "10px" }}>
                                <Tooltip title="This deployment is hosted on the decentralized network" placement="top" ><span style={{ padding: "4px 6px 2px 7px", borderRadius: "50%", backgroundColor: "rgb(102,86,248)", cursor: "default", fontWeight: "800" }}>D</span></Tooltip>
                            </span>
                            {curationElement}
                        </TableCell>
                        <TableCell sx={{ backgroundColor: "rgb(55, 55, 55)", padding: "0", paddingRight: "16px", textAlign: "right" }}>

                        </TableCell>
                        <TableCell sx={{ backgroundColor: "rgb(55, 55, 55)", color: "white", padding: "0 16px 0 30px", textAlign: "right", display: "flex" }}>
                            <NetworkLogo tooltip={depo.chain} key={subgraphName + depo.chain + 'Logo-DECEN'} size={30} network={depo.chain} />
                        </TableCell>
                        <TableCell sx={{ backgroundColor: "rgb(55, 55, 55)", color: "white", padding: "0", paddingRight: "16px", textAlign: "right" }}>
                            {depo?.status === "prod" ? <img src="https://images.emojiterra.com/twitter/v13.1/512px/2705.png" height="24px" width="24px" /> : <img src="https://github.githubassets.com/images/icons/emoji/unicode/1f6e0.png" height="24px" width="24px" />}
                        </TableCell>
                        <TableCell sx={{ backgroundColor: "rgb(55, 55, 55)", color: "white", padding: "0", paddingRight: "16px", textAlign: "right" }}>
                            {indexedDecen ? indexedDecen + "%" : "N/A"}
                        </TableCell>
                        <TableCell sx={{ backgroundColor: "rgb(55, 55, 55)", color: "white", padding: "0", paddingRight: "16px", textAlign: "right" }}>
                            {!!Number(statusDecenDataOnChain?.earliestBlock?.number) ? Number(statusDecenDataOnChain?.earliestBlock?.number)?.toLocaleString() : "N/A"}
                        </TableCell>
                        <TableCell sx={{ backgroundColor: "rgb(55, 55, 55)", color: "white", padding: "0", paddingRight: "16px", textAlign: "right" }}>
                            {!!Number(statusDecenDataOnChain?.latestBlock?.number) ? Number(statusDecenDataOnChain?.latestBlock?.number)?.toLocaleString() : "N/A"}
                        </TableCell>
                        <TableCell sx={{ backgroundColor: "rgb(55, 55, 55)", color: "white", padding: "0", paddingRight: "16px", textAlign: "right" }}>
                            {!!Number(statusDecenDataOnChain?.chainHeadBlock?.number) ? Number(statusDecenDataOnChain?.chainHeadBlock?.number)?.toLocaleString() : "N/A"}
                        </TableCell>
                        <TableCell sx={{ backgroundColor: "rgb(55, 55, 55)", color: "white", padding: "0", paddingRight: "16px", textAlign: "right" }}>
                            <Typography variant="h5" sx={{ width: "100%" }} fontSize={14}>
                                {schemaCell}
                            </Typography>
                        </TableCell>
                        <TableCell sx={{ backgroundColor: "rgb(55, 55, 55)", color: "white", padding: "0", paddingRight: "16px", textAlign: "right" }}>
                            <Typography variant="h5" sx={{ width: "100%" }} fontSize={14}>
                                {depo?.versions?.subgraph || "N/A"}
                            </Typography>
                        </TableCell>

                        <TableCell sx={{ backgroundColor: "rgb(55, 55, 55)", color: "white", padding: "0", paddingRight: "16px", textAlign: "right" }}>
                            <Typography variant="h5" sx={{ width: "100%" }} fontSize={14}>
                                {parseInt(decenObject?.entityCount) ? parseInt(decenObject?.entityCount)?.toLocaleString() : "N/A"}
                            </Typography>
                        </TableCell>
                    </TableRow >
                );
            }
            const currentObject = depo?.indexStatus;
            let { synced } = currentObject ?? {};
            let statusDataOnChain: { [x: string]: any } = {};
            if (currentObject?.chains?.length > 0) {
                statusDataOnChain = currentObject?.chains[0];
            }

            let highlightColor = "#B8301C";
            if (!currentObject?.fatalError) {
                highlightColor = "#EFCB68";
            }
            let indexed = formatIntToFixed2(toPercent(
                statusDataOnChain?.latestBlock?.number - statusDataOnChain?.earliestBlock?.number || 0,
                statusDataOnChain?.chainHeadBlock?.number - statusDataOnChain?.earliestBlock?.number,
            ));
            if (synced && !currentObject?.fatalError && Number(indexed) > 99) {
                indexed = formatIntToFixed2(100);
                highlightColor = "#58BC82";
            }

            if (Object.keys(statusDataOnChain)?.length === 0) {
                indexed = "";
            }

            let schemaCell = <span>{depo?.versions?.schema}</span>;

            if (!depo?.versions?.schema || !latestSchemaVersions.includes(depo?.versions?.schema)) {
                schemaCell = <Tooltip title="This deployment does not have the latest schema verison" placement="top" ><span style={{ color: "#FFA500" }}>{depo?.versions?.schema || "N/A"}</span></Tooltip>
            }

            let subgraphUrlBase = "";
            if (depo.chain === "cronos") {
                subgraphUrlBase = "https://graph.cronoslabs.com/subgraphs/name/";
            }

            if (!isLoaded) {
                return (<>
                    <TableRow onClick={(event) => {
                        if (event.ctrlKey) {
                            if (!validationSupported) {
                                window.open("https://thegraph.com/hosted-service/subgraph/messari/" + depo.hostedServiceId + "?version=pending", "_blank");
                                return;
                            }
                            if (!currentObject?.fatalError) {
                                window.open(`https://subgraphs.messari.io/subgraph?endpoint=${subgraphUrlBase}messari/${depo.hostedServiceId}&tab=protocol`, "_blank");
                            } else {
                                window.open("https://okgraph.xyz/?q=" + depo.hostedServiceId, "_blank");
                            }
                        } else {
                            if (!validationSupported) {
                                window.location.href = "https://thegraph.com/hosted-service/subgraph/messari/" + depo.hostedServiceId + "?version=pending";
                                return;
                            }
                            if (!currentObject?.fatalError) {
                                navigate(`subgraph?endpoint=${subgraphUrlBase}messari/${depo.hostedServiceId}&tab=protocol`)
                            } else {
                                window.location.href = "https://okgraph.xyz/?q=" + depo.hostedServiceId;
                            }
                        }
                        return;
                    }} key={subgraphName + depo.hostedServiceId + "DepInDevRow"} sx={{ height: "10px", width: "100%", backgroundColor: "rgba(22,24,29,0.9)", cursor: "pointer" }}>
                        <TableCell
                            sx={{ backgroundColor: "rgb(55, 55, 55)", color: "white", padding: "0", paddingLeft: "6px", borderLeft: `rgb(55, 55, 55) solid 34px`, verticalAlign: "middle", display: "flex" }}
                        >
                            <SubgraphLogo name={subgraphName} size={30} />
                            <span style={{ display: "inline-flex", alignItems: "center", padding: "0px 10px", fontSize: "14px" }}>
                                {chainLabel}
                            </span>
                        </TableCell>
                        <TableCell sx={{ backgroundColor: "rgb(55, 55, 55)", padding: "0", paddingRight: "16px", textAlign: "right" }}>
                        </TableCell>
                        <TableCell sx={{ backgroundColor: "rgb(55, 55, 55)", color: "white", padding: "0 16px 0 30px", textAlign: "right", display: "flex" }}>
                            <NetworkLogo tooltip={depo.chain} key={subgraphName + depo.hostedServiceId + 'Logo'} size={30} network={depo.chain} />
                        </TableCell>
                        <TableCell sx={{ backgroundColor: "rgb(55, 55, 55)", color: "white", padding: "0", paddingRight: "16px", textAlign: "right" }}>
                            {depo?.status === "prod" ? <img src="https://images.emojiterra.com/twitter/v13.1/512px/2705.png" height="24px" width="24px" /> : <img src="https://github.githubassets.com/images/icons/emoji/unicode/1f6e0.png" height="24px" width="24px" />}
                        </TableCell>
                        <TableCell sx={{ backgroundColor: "rgb(55, 55, 55)", color: "white", padding: "0", paddingRight: "16px", textAlign: "right" }}>
                            <CircularProgress size={20} />
                        </TableCell>
                        <TableCell sx={{ backgroundColor: "rgb(55, 55, 55)", color: "white", padding: "0", paddingRight: "16px", textAlign: "right" }}>
                            <CircularProgress size={20} />
                        </TableCell>
                        <TableCell sx={{ backgroundColor: "rgb(55, 55, 55)", color: "white", padding: "0", paddingRight: "16px", textAlign: "right" }}>
                            <CircularProgress size={20} />
                        </TableCell>
                        <TableCell sx={{ backgroundColor: "rgb(55, 55, 55)", color: "white", padding: "0", paddingRight: "16px", textAlign: "right" }}>
                            <CircularProgress size={20} />
                        </TableCell>
                        <TableCell sx={{ backgroundColor: "rgb(55, 55, 55)", color: "white", padding: "0", paddingRight: "16px", textAlign: "right" }}>
                            <Typography variant="h5" sx={{ width: "100%" }} fontSize={14}>
                                {schemaCell}
                            </Typography>
                        </TableCell>
                        <TableCell sx={{ backgroundColor: "rgb(55, 55, 55)", color: "white", padding: "0", paddingRight: "16px", textAlign: "right" }}>
                            <Typography variant="h5" sx={{ width: "100%" }} fontSize={14}>
                                {depo?.versions?.subgraph || "N/A"}
                            </Typography>
                        </TableCell>
                        <TableCell sx={{ backgroundColor: "rgb(55, 55, 55)", color: "white", padding: "0", paddingRight: "16px", textAlign: "right" }}>
                            <CircularProgress size={20} />
                        </TableCell>
                    </TableRow>
                    {pendingRow}
                </>)
            }

            return (
                <>
                    {decenRow}
                    <TableRow onClick={(event) => {
                        if (event.ctrlKey) {
                            if (!validationSupported) {
                                window.open("https://thegraph.com/hosted-service/subgraph/messari/" + depo.hostedServiceId + "?version=pending", "_blank");
                                return;
                            }
                            if (!currentObject?.fatalError) {
                                window.open(`https://subgraphs.messari.io/subgraph?endpoint=${subgraphUrlBase}messari/${depo.hostedServiceId}&tab=protocol`, "_blank");
                            } else {
                                window.open("https://okgraph.xyz/?q=" + depo.hostedServiceId, "_blank");
                            }
                        } else {
                            if (!validationSupported) {
                                window.location.href = "https://thegraph.com/hosted-service/subgraph/messari/" + depo.hostedServiceId + "?version=pending";
                                return;
                            }
                            if (!currentObject?.fatalError) {
                                navigate(`subgraph?endpoint=${subgraphUrlBase}messari/${depo.hostedServiceId}&tab=protocol`)
                            } else {
                                window.location.href = "https://okgraph.xyz/?q=" + depo.hostedServiceId;
                            }
                        }
                        return;
                    }} key={subgraphName + depo.hostedServiceId + "DepInDevRow"} sx={{ height: "10px", width: "100%", backgroundColor: "rgba(22,24,29,0.9)", cursor: "pointer" }}>
                        <TableCell
                            sx={{ backgroundColor: "rgb(55, 55, 55)", color: "white", padding: "0", paddingLeft: "6px", borderLeft: `${highlightColor} solid 34px`, verticalAlign: "middle", display: "flex" }}
                        >
                            <SubgraphLogo name={subgraphName} size={30} />
                            <span style={{ display: "inline-flex", alignItems: "center", padding: "0px 10px", fontSize: "14px" }}>
                                {chainLabel}
                            </span>
                        </TableCell>
                        <TableCell sx={{ backgroundColor: "rgb(55, 55, 55)", padding: "0", paddingRight: "16px", textAlign: "right" }}>

                        </TableCell>
                        <TableCell sx={{ backgroundColor: "rgb(55, 55, 55)", color: "white", padding: "0 16px 0 30px", textAlign: "right", display: "flex" }}>
                            <NetworkLogo tooltip={depo.chain} key={subgraphName + depo.hostedServiceId + 'Logo'} size={30} network={depo.chain} />
                        </TableCell>
                        <TableCell sx={{ backgroundColor: "rgb(55, 55, 55)", color: "white", padding: "0", paddingRight: "16px", textAlign: "right" }}>
                            {depo?.status === "prod" ? <img src="https://images.emojiterra.com/twitter/v13.1/512px/2705.png" height="24px" width="24px" /> : <img src="https://github.githubassets.com/images/icons/emoji/unicode/1f6e0.png" height="24px" width="24px" />}
                        </TableCell>
                        <TableCell sx={{ backgroundColor: "rgb(55, 55, 55)", color: "white", padding: "0", paddingRight: "16px", textAlign: "right" }}>
                            {indexed ? indexed + "%" : "N/A"}
                        </TableCell>
                        <TableCell sx={{ backgroundColor: "rgb(55, 55, 55)", color: "white", padding: "0", paddingRight: "16px", textAlign: "right" }}>
                            {statusDataOnChain?.earliestBlock?.number ? Number(statusDataOnChain?.earliestBlock?.number)?.toLocaleString() : "N/A"}
                        </TableCell>
                        <TableCell sx={{ backgroundColor: "rgb(55, 55, 55)", color: "white", padding: "0", paddingRight: "16px", textAlign: "right" }}>
                            {statusDataOnChain?.latestBlock?.number ? Number(statusDataOnChain?.latestBlock?.number)?.toLocaleString() : "N/A"}
                        </TableCell>
                        <TableCell sx={{ backgroundColor: "rgb(55, 55, 55)", color: "white", padding: "0", paddingRight: "16px", textAlign: "right" }}>
                            {statusDataOnChain?.chainHeadBlock?.number ? Number(statusDataOnChain?.chainHeadBlock?.number)?.toLocaleString() : "N/A"}
                        </TableCell>
                        <TableCell sx={{ backgroundColor: "rgb(55, 55, 55)", color: "white", padding: "0", paddingRight: "16px", textAlign: "right" }}>
                            <Typography variant="h5" sx={{ width: "100%" }} fontSize={14}>
                                {schemaCell}
                            </Typography>
                        </TableCell>
                        <TableCell sx={{ backgroundColor: "rgb(55, 55, 55)", color: "white", padding: "0", paddingRight: "16px", textAlign: "right" }}>
                            <Typography variant="h5" sx={{ width: "100%" }} fontSize={14}>
                                {depo?.versions?.subgraph || "N/A"}
                            </Typography>
                        </TableCell>

                        <TableCell sx={{ backgroundColor: "rgb(55, 55, 55)", color: "white", padding: "0", paddingRight: "16px", textAlign: "right" }}>
                            <Typography variant="h5" sx={{ width: "100%" }} fontSize={14}>
                                {parseInt(currentObject?.entityCount) ? parseInt(currentObject?.entityCount)?.toLocaleString() : "N/A"}
                            </Typography>
                        </TableCell>
                    </TableRow>
                    {pendingRow}
                </>

            )
        })

        return (<>
            <TableRow onClick={() => {
                toggleShowDeposDropDown(!showDeposDropDown);
            }} key={subgraphName + "DepInDevRow"} sx={{ cursor: "pointer", height: "10px", width: "100%", backgroundColor: "rgba(22,24,29,0.9)" }}>
                <TableCell
                    sx={{ padding: "0", paddingLeft: "6px", verticalAlign: "middle", display: "flex" }}
                >
                    <SubgraphLogo name={subgraphName} size={30} />
                    <span style={{ display: "inline-flex", alignItems: "center", padding: "0px 10px", fontSize: "14px" }}>
                        {subgraphName}
                    </span>
                </TableCell>
                <TableCell sx={{ padding: "0", paddingRight: "16px", textAlign: "right" }}>
                    <img className="rotated" height="24px" width="24px" src="https://cdn2.iconfinder.com/data/icons/50-material-design-round-corner-style/44/Dropdown_2-512.png" />

                </TableCell>
                <TableCell sx={{ padding: "0", paddingRight: "6px", textAlign: "right", display: "flex" }}>
                    {protocol.networks.map((x: { [x: string]: any }) => {
                        const decenObject = x?.indexStatus;
                        let syncedDecen = decenObject?.synced ?? {};
                        let statusDecenDataOnChain: { [x: string]: any } = {};
                        if (decenObject?.chains?.length > 0) {
                            statusDecenDataOnChain = decenObject?.chains[0];
                        }

                        let indexedDecen = formatIntToFixed2(toPercent(
                            statusDecenDataOnChain?.latestBlock?.number - statusDecenDataOnChain?.earliestBlock?.number || 0,
                            statusDecenDataOnChain?.chainHeadBlock?.number - statusDecenDataOnChain?.earliestBlock?.number,
                        ));

                        if (syncedDecen && !decenObject?.fatalError && Number(indexedDecen) > 99) {
                            indexedDecen = formatIntToFixed2(100);
                        }
                        return <a key={"CellNetwork-" + x.chain + x.hostedServiceId} href={"https://thegraph.com/hosted-service/subgraph/messari/" + x.hostedServiceId} ><NetworkLogo tooltip={`${x.chain} (${indexedDecen}%)`} size={30} network={x.chain} /></a>
                    })
                    }
                </TableCell>
                <TableCell sx={{ padding: "0", paddingRight: "16px", textAlign: "right" }}>
                    {protocol?.status ? <img src="https://images.emojiterra.com/twitter/v13.1/512px/2705.png" height="24px" width="24px" /> : <img src="https://github.githubassets.com/images/icons/emoji/unicode/1f6e0.png" height="24px" width="24px" />}
                </TableCell>
                <TableCell sx={{ padding: "0", paddingRight: "16px", textAlign: "right" }}>
                    -
                </TableCell>
                <TableCell sx={{ padding: "0", paddingRight: "16px", textAlign: "right" }}>
                    -
                </TableCell>
                <TableCell sx={{ padding: "0", paddingRight: "16px", textAlign: "right" }}>
                    -
                </TableCell>
                <TableCell sx={{ padding: "0", paddingRight: "16px", textAlign: "right" }}>
                    -
                </TableCell>
                <TableCell sx={{ padding: "0", paddingRight: "16px", textAlign: "right" }}>
                    -
                </TableCell>
                <TableCell sx={{ padding: "0", paddingRight: "16px", textAlign: "right" }}>
                    -
                </TableCell>
                <TableCell sx={{ padding: "0", paddingRight: "16px", textAlign: "right" }}>
                    -
                </TableCell>

            </TableRow>
            {depoRowsOnProtocol}
        </>)
    }

    let schemaCell = <span>N/A</span>;
    if (protocol?.schemaVersions?.length > 0) {
        const schemaColored = protocol?.schemaVersions?.map((x: string, idx: number) => {
            if (latestSchemaVersions.includes(x)) {
                return <span>{x}</span>;
            }
            return <span key={subgraphName + "-protocol-schemaVerRow-" + idx} style={{ color: "#FFA500" }}>{x}</span>;
        })
        schemaCell = <span>{schemaColored}</span>;
    }

    let decenDepoElement = null;
    if (hasDecentralizedDepo) {
        decenDepoElement = (
            <span style={{ display: "inline-flex", alignItems: "center", padding: "0px 10px", fontSize: "10px" }}>
                <Tooltip title="This protocol has deployments hosted on the decentralized network" placement="top" ><span style={{ padding: "4px 6px 2px 7px", borderRadius: "50%", backgroundColor: "rgb(102,86,248)", cursor: "default", fontWeight: "800" }}>D</span></Tooltip>
            </span>
        );
    }

    return (
        <TableRow onClick={() => {
            toggleShowDeposDropDown(!showDeposDropDown);
        }} key={subgraphName + "DepInDevRow"} sx={{ height: "10px", width: "100%", backgroundColor: "rgba(22,24,29,0.9)", cursor: "pointer" }}>
            <TableCell
                sx={{ padding: "0 0 0 6px", verticalAlign: "middle", display: "flex", height: "35px" }}
            >

                <Tooltip title="Click To View All Deployments On This Protocol" placement="top" >
                    <SubgraphLogo name={subgraphName} size={30} />
                </Tooltip>
                <Tooltip title="Click To View All Deployments On This Protocol" placement="top" >
                    <span style={{ display: "inline-flex", alignItems: "center", padding: "0px 10px", fontSize: "14px" }}>
                        {subgraphName}
                    </span>
                </Tooltip>
                {decenDepoElement}
            </TableCell>
            <TableCell sx={{ padding: "0", paddingRight: "16px", textAlign: "right" }}>
                <Tooltip title="Click To View All Deployments On This Protocol" placement="top" >
                    <img height="24px" width="24px" src="https://cdn2.iconfinder.com/data/icons/50-material-design-round-corner-style/44/Dropdown_2-512.png" />
                </Tooltip>
            </TableCell>
            <TableCell sx={{ padding: "0 6px 1px 0", textAlign: "right", display: "flex" }}>
                <Tooltip title="Click To View All Deployments On This Protocol" placement="top" >
                    <>
                        {protocol.networks.map((x: { [x: string]: any }) => {
                            const decenObject = x?.indexStatus;
                            let syncedDecen = decenObject?.synced ?? {};
                            let statusDecenDataOnChain: { [x: string]: any } = {};
                            if (decenObject?.chains?.length > 0) {
                                statusDecenDataOnChain = decenObject?.chains[0];
                            }

                            let indexedDecen = formatIntToFixed2(toPercent(
                                statusDecenDataOnChain?.latestBlock?.number - statusDecenDataOnChain?.earliestBlock?.number || 0,
                                statusDecenDataOnChain?.chainHeadBlock?.number - statusDecenDataOnChain?.earliestBlock?.number,
                            ));

                            if (syncedDecen && !decenObject?.fatalError && Number(indexedDecen) > 99) {
                                indexedDecen = formatIntToFixed2(100);
                            }
                            let borderColor = "#EFCB68";
                            if (!!x?.indexStatus?.synced && !x?.indexStatus?.fatalError) {
                                borderColor = "#58BC82";
                            }
                            if (!!x?.indexStatus?.fatalError) {
                                borderColor = "#B8301C";
                            }
                            return <a key={subgraphName + x.hostedServiceId + 'Logo'} style={{ height: "100%", border: borderColor + " 4px solid", borderRadius: "50%" }} href={"https://thegraph.com/hosted-service/subgraph/messari/" + x.hostedServiceId} ><NetworkLogo tooltip={`${x.chain} (${indexedDecen}%)`} size={28} network={x.chain} /></a>
                        })}
                    </>
                </Tooltip>
            </TableCell>
            <TableCell sx={{ padding: "0", paddingRight: "16px", textAlign: "right" }}>
                {protocol?.status ? <img src="https://images.emojiterra.com/twitter/v13.1/512px/2705.png" height="24px" width="24px" /> : <img src="https://github.githubassets.com/images/icons/emoji/unicode/1f6e0.png" height="24px" width="24px" />}
            </TableCell>
            <TableCell sx={{ padding: "0", paddingRight: "16px", textAlign: "right" }}>

            </TableCell>
            <TableCell sx={{ padding: "0", paddingRight: "16px", textAlign: "right" }}>

            </TableCell>
            <TableCell sx={{ padding: "0", paddingRight: "16px", textAlign: "right" }}>

            </TableCell>
            <TableCell sx={{ padding: "0", paddingRight: "16px", textAlign: "right" }}>

            </TableCell>
            <TableCell sx={{ padding: "0", paddingRight: "16px", textAlign: "right" }}>
                <Tooltip title="Click To View All Deployments On This Protocol" placement="top" >

                    <Typography variant="h5" sx={{ width: "100%" }} fontSize={14}>
                        {schemaCell}
                    </Typography>
                </Tooltip>
            </TableCell>
            <TableCell sx={{ padding: "0", paddingRight: "16px", textAlign: "right" }}>
                <Tooltip title="Click To View All Deployments On This Protocol" placement="top" >

                    <Typography variant="h5" sx={{ width: "100%" }} fontSize={14}>
                        {protocol?.subgraphVersions?.length > 0 ? protocol?.subgraphVersions.join(", ") : "N/A"}
                    </Typography>
                </Tooltip>
            </TableCell>

            <TableCell sx={{ padding: "0", paddingRight: "16px", textAlign: "right" }}>

            </TableCell>
        </TableRow >
    )
}

export default ProtocolSection;