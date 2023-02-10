import { useEffect, useState } from "react";
import { Button, Table, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { schemaMapping } from "../utils";
import { Chart as ChartJS, registerables, PointElement } from "chart.js";
import FetchSubgraphVersion from "./FetchSubgraphVersion";
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

    useEffect(() => {
        if (!protocolsToQuery || Object.keys(protocolsToQuery).length === 0) {
            getData();
        }
    }, []);

    Object.keys(protocolsToQuery).forEach(protocol => {
        Object.keys(protocolsToQuery[protocol].deployments).forEach(depo => {
            if (protocolsToQuery[protocol].deployments[depo].status === "prod") {
                const schemaName = schemaMapping[protocolsToQuery[protocol].schema];
                if (schemaName) {
                    prodDeploymentsToQuery.push(protocolsToQuery[protocol].deployments[depo]);
                    const depoData = protocolsToQuery[protocol].deployments[depo];
                    let slug = depoData?.["services"]?.["hosted-service"]?.["slug"];
                    if (depoData.network === "cronos") {
                        slug = depoData?.["services"]?.["cronos-portal"]?.["slug"];
                    }
                    if (!slugsListByType[schemaName]) {
                        slugsListByType[schemaName] = [];
                    }
                    slugToVersionJSON[slug] = protocolsToQuery[protocol].deployments[depo].versions.subgraph;
                    slugsListByType[schemaName].push(slug);
                }
            }
        })
    })

    let fetchVersionComponent = null;

    if (prodDeploymentsToQuery.length > 0) {
        fetchVersionComponent = (<>
            {prodDeploymentsToQuery.map((depo: any) => {
                let slug = depo?.["services"]?.["hosted-service"]?.["slug"];
                let endpoint = "https://api.thegraph.com/subgraphs/name/messari/" + slug;
                if (depo.network === "cronos") {
                    slug = depo?.["services"]?.["cronos-portal"]?.["slug"];
                    endpoint = "https://graph.cronoslabs.com/subgraphs/name/messari/" + slug;
                }
                slugToQueryString[slug] = 'messari/' + slug;
                return <FetchSubgraphVersion subgraphEndpoint={endpoint} slug={slug} setDeployments={setSubgraphVersionMapping} />
            })}
        </>)
    }

    const columnLabels: string[] = [
        "Deployment",
        "Schema Type",
        "Subgraph Version on Protocol Entity",
        "Subgraph Version on JSON"
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
            if (subgraphVersionMapping[depo] !== slugToVersionJSON[depo]) {
                return (
                    <TableRow onClick={() => window.location.href = "https://subgraphs.xyz/subgraph?endpoint=" + slugToQueryString[depo] + "&tab=protocol"} key={depo + "PROTOCOLLISTROW"} sx={{ height: "10px", width: "100%", backgroundColor: "rgba(22,24,29,0.9)", cursor: "pointer" }}>
                        <TableCell sx={{ padding: "0 0 0 6px", verticalAlign: "middle", height: "30px" }}>
                            {depo}
                        </TableCell>
                        <TableCell sx={{ padding: "0", paddingRight: "6px", textAlign: "left" }}>
                            {type}
                        </TableCell>
                        <TableCell sx={{ padding: "0", paddingRight: "6px", textAlign: "right" }}>
                            {subgraphVersionMapping[depo] || 'N/A'}
                        </TableCell>
                        <TableCell sx={{ padding: "0", paddingRight: "6px", textAlign: "right" }}>
                            {slugToVersionJSON[depo] || 'N/A'}
                        </TableCell>
                    </TableRow>
                )
            } else {
                return null
            }
        });

        if (rowsOnTypeTable.filter((x: any) => !!x)?.length === 0) {
            return null;
        }

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
            {fetchVersionComponent}
            {tablesBySchemaType}
        </div>
    );
}

export default OutOfSyncList;
