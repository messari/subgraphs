import { Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { SubgraphLogo } from "../common/SubgraphLogo";
import { NetworkLogo } from "../common/NetworkLogo";
import { useNavigate } from "react-router";
import DeploymentsInDevelopmentRow from "./DeploymentsInDevelopmentRow";

interface DeploymentsInDevelopment {
    protocolsToQuery: { [x: string]: any };
    getData: any;
}

function DeploymentsInDevelopment({ protocolsToQuery, getData }: DeploymentsInDevelopment) {
    const navigate = useNavigate();

    if (Object.keys(protocolsToQuery).length === 0) {
        getData();
        return null;
    }
    const columnLabels: string[] = [
        "Name",
        "",
        "Network",
        "Status",
        "Schema Version",
        "Subgraph Version",
        "Methodology Version"
    ];

    const tableHead = (
        <TableHead sx={{ height: "20px" }}>
            <TableRow sx={{ height: "20px" }}>
                {columnLabels.map((x, idx) => {
                    let textAlign = "left";
                    let paddingLeft = "0px"
                    if (idx > 2) {
                        textAlign = "right";
                        paddingLeft = "16px";
                    }
                    return (
                        <TableCell sx={{ paddingLeft }} key={"column" + x}>
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
            deposInProgress[protocol.schema][protocolName].networks.push({ chain: deploymentData.network, status: deploymentData?.status, versions: deploymentData?.versions, hostedServiceId: deploymentData["deployment-ids"]["hosted-service"] });
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
            <div style={{ width: "100%", textAlign: "right", marginTop: "20px" }}>
                <Button variant="contained" color="primary" onClick={() => navigate("/")}>
                    Deployments Page
                </Button>
            </div>
            <Typography variant="h4" align="center" sx={{ my: 4 }}>
                {protocolsProdReadyCount} prod-ready, {protocolsInProgressCount} under development, {totalDepoCounter} subgraph deployments
            </Typography>
            {Object.entries(deposInProgress).map(([schemaType, subgraph]) => {
                const tableRows = Object.keys(subgraph).map((subgraphName) => {
                    const protocol = subgraph[subgraphName];
                    return (<DeploymentsInDevelopmentRow subgraphName={subgraphName} protocol={protocol} />);
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

export default DeploymentsInDevelopment;