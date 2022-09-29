import { gql, useLazyQuery } from "@apollo/client";
import { CircularProgress, TableCell, TableRow, Tooltip, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { NetworkLogo } from "../common/NetworkLogo";
import { SubgraphLogo } from "../common/SubgraphLogo";
import { latestSchemaVersions } from "../constants";
import { formatIntToFixed2, toPercent } from "../utils";

interface ProtocolSection {
    protocol: { [x: string]: any };
    subgraphName: string;
    clientIndexing: any;
    decenDeposToSubgraphIds: { [x: string]: string };
}

function ProtocolSection({ protocol, subgraphName, clientIndexing, decenDeposToSubgraphIds }: ProtocolSection) {
    const [showDeposDropDown, toggleShowDeposDropDown] = useState<boolean>(false);
    const navigate = useNavigate();
    const navigateToSubgraph = (url: string) => () => {
        navigate(`subgraph?endpoint=${url}&tab=protocol`);
    };

    const fullCurrentQueryArray = ["query Status {"];
    const fullPendingQueryArray = ["query Status {"];

    const queryContents = `
      subgraph
      node
      synced
      health
      fatalError {
        message
        handler
      }
      chains {
        network
        chainHeadBlock {
          number
        }
        earliestBlock {
          number
        }
        latestBlock {
          number
        }
        lastHealthyBlock {
          number
        }
      }
      entityCount`;

    protocol.networks.forEach((depo: any) => {
        fullCurrentQueryArray.push(`        
              ${depo?.hostedServiceId
                ?.split("-")
                ?.join(
                    "_"
                )}: indexingStatusForCurrentVersion(subgraphName: "messari/${depo?.hostedServiceId}") {
                ${queryContents}
              }
          `);
        fullPendingQueryArray.push(`        
            ${depo?.hostedServiceId
                ?.split("-")
                ?.join(
                    "_"
                )}_pending: indexingStatusForPendingVersion(subgraphName: "messari/${depo?.hostedServiceId}") {
              ${queryContents}
            }
        `);
    });
    fullCurrentQueryArray.push("}");
    fullPendingQueryArray.push("}");

    const [fetchStatus, {
        data: status,
        error: errorIndexing,
        loading: statusLoading,
    }] = useLazyQuery(gql`${fullCurrentQueryArray.join("")}`, {
        client: clientIndexing,
    });

    const [fetchStatusPending, {
        data: statusPending,
        error: errorIndexingPending,
        loading: statusLoadingPending,
    }] = useLazyQuery(gql`${fullPendingQueryArray.join("")}`, {
        client: clientIndexing,
    });

    useEffect(() => {
        if (showDeposDropDown && !status) {
            fetchStatus();
            fetchStatusPending();
        }
    }, [showDeposDropDown])

    if (showDeposDropDown) {
        if (statusLoading || statusLoadingPending) {
            return protocol.networks.map((key: any, idx: number) => <div key={"Loader" + idx} style={{ width: "100%" }}><CircularProgress size={30} /></div>);
        }

        if (!status || !!errorIndexing) {
            return null;
        }

        const depoRowsOnProtocol = protocol.networks.map((depo: any) => {
            let chainLabel = depo.chain;
            if (protocol.networks.filter((x: any) => x.chain === depo.chain).length > 1) {
                chainLabel = depo.deploymentName;
            }
            let pendingRow = null;
            const depoKey = depo?.hostedServiceId?.split("-")?.join("_");
            if (!!statusPending) {
                if (!!statusPending[depoKey + "_pending"]) {
                    const pendingObject = statusPending[depoKey + "_pending"];
                    let { syncedPending } = pendingObject ?? {};
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

                    if (syncedPending) {
                        highlightColor = "#58BC82";
                        indexedPending = formatIntToFixed2(100);
                    }

                    let schemaCell = <span>{depo?.versions?.schema}</span>;

                    if (!depo?.versions?.schema || !latestSchemaVersions.includes(depo?.versions?.schema)) {
                        schemaCell = <Tooltip title="This deployment does not have the latest schema verison" placement="top" ><span style={{ color: "#FFA500" }}>{depo?.versions?.schema || "N/A"}</span></Tooltip>
                    }

                    pendingRow = (
                        <TableRow onClick={() => navigate(`subgraph?endpoint=messari/${depo.hostedServiceId}&tab=protocol&version=pending`)} key={subgraphName + depo.hostedServiceId + "DepInDevRow-PENDING"} sx={{ height: "10px", width: "100%", backgroundColor: "rgba(22,24,29,0.9)", cursor: "pointer" }}>
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
                                <NetworkLogo key={subgraphName + depo.chain + 'Logo-PENDING'} size={30} network={depo.chain} />
                            </TableCell>
                            <TableCell sx={{ backgroundColor: "rgb(55, 55, 55)", color: "white", padding: "0", paddingRight: "16px", textAlign: "right" }}>
                                {indexedPending ? indexedPending + "%" : "N/A"}
                            </TableCell>
                            <TableCell sx={{ backgroundColor: "rgb(55, 55, 55)", color: "white", padding: "0", paddingRight: "16px", textAlign: "right" }}>
                                {Number(statusPendingDataOnChain?.earliestBlock?.number)?.toLocaleString()}
                            </TableCell>
                            <TableCell sx={{ backgroundColor: "rgb(55, 55, 55)", color: "white", padding: "0", paddingRight: "16px", textAlign: "right" }}>
                                {Number(statusPendingDataOnChain?.latestBlock?.number)?.toLocaleString()}
                            </TableCell>
                            <TableCell sx={{ backgroundColor: "rgb(55, 55, 55)", color: "white", padding: "0", paddingRight: "16px", textAlign: "right" }}>
                                {Number(statusPendingDataOnChain?.chainHeadBlock?.number)?.toLocaleString() || "?"}
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
                const decenObject = status[depoKey];
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

                if (syncedDecen) {
                    highlightColor = "#58BC82";
                    indexedDecen = formatIntToFixed2(100);
                }

                const decenSubgraphKey = Object.keys(decenDeposToSubgraphIds)?.find(x => subgraphName.includes(x));
                let decenSubgraphId = decenObject?.subgraph;
                if (decenSubgraphKey) {
                    decenSubgraphId = decenDeposToSubgraphIds[decenSubgraphKey];
                }
                const endpointURL =
                    "https://gateway.thegraph.com/api/" + process.env.REACT_APP_GRAPH_API_KEY + "/subgraphs/id/" + decenSubgraphId;

                let schemaCell = <span>{depo?.versions?.schema}</span>;

                if (!depo?.versions?.schema || !latestSchemaVersions.includes(depo?.versions?.schema)) {
                    schemaCell = <Tooltip title="This deployment does not have the latest schema verison" placement="top" ><span style={{ color: "#FFA500" }}>{depo?.versions?.schema || "N/A"}</span></Tooltip>
                }
                let curationSymbol = null;
                if (!decenDeposToSubgraphIds[depo?.decentralizedNetworkId] && !decenDeposToSubgraphIds[depo?.hostedServiceId]) {
                    curationSymbol = (
                        <span style={{ display: "inline-flex", alignItems: "center", padding: "0px 10px", fontSize: "10px" }}>
                            <Tooltip title="No curation on this Subgraph" placement="top" ><span style={{ padding: "0 5px", borderRadius: "50%", color: "#B8301C", border: "#B8301C 1.5px solid", cursor: "default", fontWeight: "800" }}>!</span></Tooltip>
                        </span>
                    );
                }
                decenRow = (
                    <TableRow onClick={navigateToSubgraph(endpointURL)} key={subgraphName + depo.hostedServiceId + "DepInDevRow-DECEN"} sx={{ height: "10px", width: "100%", backgroundColor: "rgba(22,24,29,0.9)", cursor: "pointer" }}>
                        <TableCell
                            sx={{ backgroundColor: "rgb(55, 55, 55)", color: "white", padding: "0", paddingLeft: "6px", borderLeft: `${highlightColor} solid 34px`, verticalAlign: "middle", display: "flex" }}
                        >
                            <SubgraphLogo name={subgraphName} size={30} />
                            <span style={{ display: "inline-flex", alignItems: "center", padding: "0px 10px", fontSize: "14px" }}>
                                {chainLabel}
                            </span>
                            <span style={{ display: "inline-flex", alignItems: "center", padding: "0px 0px 0px 10px", fontSize: "14px", color: "#6f2c8a" }}>
                                <Tooltip title="This deployment is hosted on the decentralized network" placement="top" ><span style={{ cursor: "default" }}><b>Ⓓ</b></span></Tooltip>
                            </span>
                            {curationSymbol}
                        </TableCell>
                        <TableCell sx={{ backgroundColor: "rgb(55, 55, 55)", padding: "0", paddingRight: "16px", textAlign: "right" }}>

                        </TableCell>
                        <TableCell sx={{ backgroundColor: "rgb(55, 55, 55)", color: "white", padding: "0 16px 0 30px", textAlign: "right", display: "flex" }}>
                            <NetworkLogo key={subgraphName + depo.chain + 'Logo-DECEN'} size={30} network={depo.chain} />
                        </TableCell>
                        <TableCell sx={{ backgroundColor: "rgb(55, 55, 55)", color: "white", padding: "0", paddingRight: "16px", textAlign: "right" }}>
                            {indexedDecen ? indexedDecen + "%" : "N/A"}
                        </TableCell>
                        <TableCell sx={{ backgroundColor: "rgb(55, 55, 55)", color: "white", padding: "0", paddingRight: "16px", textAlign: "right" }}>
                            {Number(statusDecenDataOnChain?.earliestBlock?.number)?.toLocaleString()}
                        </TableCell>
                        <TableCell sx={{ backgroundColor: "rgb(55, 55, 55)", color: "white", padding: "0", paddingRight: "16px", textAlign: "right" }}>
                            {Number(statusDecenDataOnChain?.latestBlock?.number)?.toLocaleString()}
                        </TableCell>
                        <TableCell sx={{ backgroundColor: "rgb(55, 55, 55)", color: "white", padding: "0", paddingRight: "16px", textAlign: "right" }}>
                            {Number(statusDecenDataOnChain?.chainHeadBlock?.number)?.toLocaleString() || "?"}
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
            const currentObject = status[depoKey];
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
            if (synced) {
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


            return (
                <>
                    {decenRow}
                    <TableRow onClick={() => navigate(`subgraph?endpoint=messari/${depo.hostedServiceId}&tab=protocol`)} key={subgraphName + depo.hostedServiceId + "DepInDevRow"} sx={{ height: "10px", width: "100%", backgroundColor: "rgba(22,24,29,0.9)", cursor: "pointer" }}>
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
                            <NetworkLogo key={subgraphName + depo.hostedServiceId + 'Logo'} size={30} network={depo.chain} />
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
                    <img height="24px" width="24px" src="https://cdn2.iconfinder.com/data/icons/50-material-design-round-corner-style/44/Dropdown_2-512.png" />

                </TableCell>
                <TableCell sx={{ padding: "0", paddingRight: "6px", textAlign: "right", display: "flex" }}>
                    {protocol.networks.map((x: { [x: string]: any }) => <a key={"CellNetwork-" + x.chain + x.hostedServiceId} href={"https://thegraph.com/hosted-service/subgraph/messari/" + x.hostedServiceId} ><NetworkLogo size={30} network={x.chain} /></a>)}
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
        const schemaColored = protocol?.schemaVersions?.map((x: string) => {
            if (latestSchemaVersions.includes(x)) {
                return <span>{x}</span>;
            }
            return <span style={{ color: "#FFA500" }}>{x}</span>;
        })

        schemaCell = <span>{schemaColored}</span>;
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

            </TableCell>
            <TableCell sx={{ padding: "0", paddingRight: "16px", textAlign: "right" }}>
                <Tooltip title="Click To View All Deployments On This Protocol" placement="top" >
                    <img height="24px" width="24px" src="https://cdn2.iconfinder.com/data/icons/50-material-design-round-corner-style/44/Dropdown_2-512.png" />
                </Tooltip>
            </TableCell>
            <TableCell sx={{ padding: "0 6px 1px 0", textAlign: "right", display: "flex" }}>
                <Tooltip title="Click To View All Deployments On This Protocol" placement="top" >
                    <>
                        {protocol.networks.map((x: { [x: string]: any }) => <a key={subgraphName + x.hostedServiceId + 'Logo'} style={{ height: "100%", border: x.chain === "polygon" ? "#FFA500 4px solid" : "#58BC82 4px solid", borderRadius: "50%" }} href={"https://thegraph.com/hosted-service/subgraph/messari/" + x.hostedServiceId} ><NetworkLogo size={28} network={x.chain} /></a>)}
                    </>
                </Tooltip>
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