import { useEffect, useState } from "react";
import { Button, Table, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { schemaMapping } from "../utils";
import { Chart as ChartJS, registerables, PointElement } from "chart.js";
import { listSchemaVersionsByType, latestSchemaVersions } from "../constants";
import FetchSchemaVersion from "./FetchSchemaVersion";
import { useNavigate } from "react-router";

interface OutOfSyncListProps {
    protocolsToQuery: { [x: string]: any };
    getData: any;
}

function OutOfSyncList({ protocolsToQuery, getData }: OutOfSyncListProps) {
    ChartJS.register(...registerables);
    ChartJS.register(PointElement);

    const navigate = useNavigate();
    const [subgraphVersionMapping, setSubgraphVersionMapping] = useState<any>({});

    const prodDeploymentsToQuery: any = [];
    const slugToVersionJSON: any = {};
    const slugsListByType: any = {};
    const slugToQueryString: any = {};
    const protocolSlugs = Object.keys(protocolsToQuery);

    useEffect(() => {
        if (!protocolsToQuery || Object.keys(protocolsToQuery).length === 0) {
            getData();
        }
    }, []);

    protocolSlugs.forEach(protocol => {
        Object.keys(protocolsToQuery[protocol].deployments).forEach(depo => {
            if (protocolsToQuery[protocol].deployments[depo].status === "prod") {
                const schemaName = schemaMapping[protocolsToQuery[protocol].schema];
                if (schemaName) {
                    const isLatestSchemaVersion = latestSchemaVersions(schemaName, protocolsToQuery[protocol].deployments[depo].versions.schema);
                    if (!isLatestSchemaVersion) {
                        prodDeploymentsToQuery.push(protocolsToQuery[protocol].deployments[depo]);
                        const depoData = protocolsToQuery[protocol].deployments[depo];
                        let slug = depoData?.["services"]?.["hosted-service"]?.["slug"];
                        if (depoData.network === "cronos") {
                            slug = depoData?.["services"]?.["cronos-portal"]?.["slug"];
                        }
                        if (!slugsListByType[schemaName]) {
                            slugsListByType[schemaName] = [];
                        }
                        slugToVersionJSON[slug] = protocolsToQuery[protocol].deployments[depo].versions.schema;
                        slugsListByType[schemaName].push(slug);
                    }
                }
            }
        })
    })

    let fetchSchemaVersionExecute = null;

    if (prodDeploymentsToQuery.length > 0) {
        fetchSchemaVersionExecute = (<>
            {prodDeploymentsToQuery.map((depo: any) => {
                let prefix = 'messari/';
                let slug = depo?.["services"]?.["hosted-service"]?.["slug"];
                if (depo.network === "cronos") {
                    prefix = 'cronos/';
                    slug = depo?.["services"]?.["cronos-portal"]?.["slug"];
                }
                const endpoint = "https://api.thegraph.com/subgraphs/name/" + prefix + slug;
                slugToQueryString[slug] = prefix + slug;
                return <FetchSchemaVersion subgraphEndpoint={endpoint} slug={slug} setSchemaDeployments={setSubgraphVersionMapping} />
            })}
        </>)
    }

    const columnLabels: string[] = [
        "Deployment",
        "Schema Type",
        "Schema Version",
        "Current Schema Version"
    ];

    const tableHead = (
        <TableHead sx={{ height: "20px" }}>
            <TableRow sx={{ height: "20px" }}>
                {columnLabels.map((col, idx) => {
                    let textAlign = "left";
                    let paddingLeft = "0px";
                    let minWidth = "auto";
                    let maxWidth = "auto";
                    if (idx > 1) {
                        textAlign = "right";
                        paddingLeft = "16px";
                    }
                    if (idx === 0) {
                        minWidth = "300px";
                        maxWidth = "300px";
                    }
                    return (
                        <TableCell sx={{ paddingLeft, minWidth, maxWidth, paddingRight: 0 }} key={"column" + col}>
                            <Typography variant="h5" fontSize={14} fontWeight={500} sx={{ margin: "0", textAlign }}>
                                {col}
                            </Typography>
                        </TableCell>
                    );
                })}
            </TableRow>
        </TableHead>
    );

    const tablesBySchemaType = Object.keys(slugsListByType).map(type => {
        const rowsOnTypeTable = slugsListByType[type].map((depo: string) => {
            const isLatestVersion = latestSchemaVersions(type, subgraphVersionMapping[depo]);
            if (!isLatestVersion) {
                return (
                    <TableRow onClick={() => window.location.href = "https://subgraphs.xyz/subgraph?endpoint=" + slugToQueryString[depo] + "&tab=protocol"} key={depo + "PROTOCOLLISTROW"} sx={{ height: "10px", width: "100%", backgroundColor: "rgba(22,24,29,0.9)", cursor: "pointer" }}>
                        <TableCell sx={{ padding: "0 0 0 6px", verticalAlign: "middle", height: "30px" }}>
                            {depo}
                        </TableCell>
                        <TableCell sx={{ padding: "0", paddingRight: "6px", textAlign: "left" }}>
                            {type}
                        </TableCell>
                        <TableCell sx={{ padding: "0", paddingRight: "6px", textAlign: "right" }}>
                            {subgraphVersionMapping[depo] || slugToVersionJSON[depo]}
                        </TableCell>
                        <TableCell sx={{ padding: "0", paddingRight: "6px", textAlign: "right" }}>
                            {listSchemaVersionsByType[type]?.[listSchemaVersionsByType[type]?.length - 1] || 'N/A'}
                        </TableCell>
                    </TableRow>
                )
            } else {
                return null;
            }
        });

        return (
            <TableContainer sx={{ my: 4, mx: 2 }} key={"TableContainer-OutOfSyncList"}>
                <div style={{ width: "97.5%" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography
                            variant="h2"
                            align="left"
                            fontSize={32}
                        >
                            {type}
                        </Typography>
                    </div>
                </div>
                <Table sx={{ width: "97.5%" }} stickyHeader>
                    {tableHead}
                    {rowsOnTypeTable}
                </Table>
            </TableContainer>
        )
    })

    return (
        <div style={{ overflowX: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", margin: "40px 24px 10px 16px" }}>
                <Button variant="contained" color="primary" onClick={() => navigate("/")}>
                    Back To Deployments List
                </Button>
            </div>
            {fetchSchemaVersionExecute}
            {tablesBySchemaType}
        </div>
    );
}

export default OutOfSyncList;
