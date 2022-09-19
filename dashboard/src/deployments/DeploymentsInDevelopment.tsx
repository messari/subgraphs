import { Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { SubgraphLogo } from "../common/SubgraphLogo";
import { NetworkLogo } from "../common/NetworkLogo";
import { useNavigate } from "react-router";

interface DeploymentsInDevelopment {
    deploymentsInDevelopment: { [x: string]: any };
    getData: any;
}

function DeploymentsInDevelopment({ deploymentsInDevelopment, getData }: DeploymentsInDevelopment) {
    const navigate = useNavigate();

    if (Object.keys(deploymentsInDevelopment).length === 0) {
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
    let deposInProgressCount = 0;
    const deposInProgress: { [x: string]: any } = {};
    Object.entries(deploymentsInDevelopment).forEach(([protocolName, protocol]) => {
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
            deposInProgress[protocol.schema][protocolName].networks.push({ chain: deploymentData.network, hostedServiceId: deploymentData["deployment-ids"]["hosted-service"] });
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
                deposInProgressCount += 1;
                deposInProgress[protocol.schema][protocolName].status = false;
            }
        });
    });

    return (
        <>
            <div style={{ width: "100%", textAlign: "right", marginTop: "20px" }}>
                <Button variant="contained" color="primary" onClick={() => navigate("/")}>
                    Deployments Page
                </Button>
            </div>
            <Typography variant="h4" align="center" sx={{ my: 4 }}>
                Subgraphs Development Status ({(totalDepoCounter - deposInProgressCount)} complete /{totalDepoCounter} deployments)
            </Typography>
            {Object.entries(deposInProgress).map(([schemaType, subgraph]) => {
                const tableRows = Object.keys(subgraph).map((subgraphName) => {
                    const protocol = subgraph[subgraphName];
                    return (
                        <TableRow key={subgraphName + "DepInDevRow"} sx={{ height: "10px", width: "100%", backgroundColor: "rgba(22,24,29,0.9)" }}>
                            <TableCell
                                sx={{ padding: "0", borderLeft: `orange solid 6px`, verticalAlign: "middle", display: "flex" }}
                            >
                                {!subgraphName.includes('evm') && !subgraphName.includes('erc721') ? <SubgraphLogo name={subgraphName} size={30} /> : null}
                                <span style={{ display: "inline-flex", alignItems: "center", padding: "0px 10px", fontSize: "14px" }}>
                                    {subgraphName}
                                </span>
                            </TableCell>
                            <TableCell sx={{ padding: "0", paddingRight: "16px", textAlign: "right" }}>
                            </TableCell>
                            <TableCell sx={{ padding: "0", paddingRight: "16px", textAlign: "right", display: "flex" }}>
                                {protocol.networks.map((x: { [x: string]: any }) => <a href={"https://thegraph.com/hosted-service/subgraph/messari/" + x.hostedServiceId} ><NetworkLogo key={subgraphName + x.chain + 'Logo'} size={30} network={x.chain} /></a>)}
                            </TableCell>
                            <TableCell sx={{ padding: "0", paddingRight: "16px", textAlign: "right" }}>
                                {protocol?.status ? <img height="24px" width="24px" src="https://github.githubassets.com/images/icons/emoji/unicode/2705.png" /> : <img src="https://github.githubassets.com/images/icons/emoji/unicode/1f6e0.png" height="24px" width="24px" />}
                            </TableCell>
                            <TableCell sx={{ padding: "0", paddingRight: "16px", textAlign: "right" }}>
                                <Typography variant="h5" sx={{ width: "100%" }} fontSize={14}>
                                    {protocol?.schemaVersions?.length > 0 ? protocol?.schemaVersions.join(", ") : "N/A"}
                                </Typography>
                            </TableCell>
                            <TableCell sx={{ padding: "0", paddingRight: "16px", textAlign: "right" }}>
                                <Typography variant="h5" sx={{ width: "100%" }} fontSize={14}>
                                    {protocol?.subgraphVersions?.length > 0 ? protocol?.subgraphVersions.join(", ") : "N/A"}
                                </Typography>
                            </TableCell>
                            <TableCell sx={{ padding: "0", paddingRight: "16px", textAlign: "right" }}>
                                <Typography variant="h5" sx={{ width: "100%" }} fontSize={14}>
                                    {protocol?.methodologyVersions?.length > 0 ? protocol?.methodologyVersions.join(", ") : "N/A"}
                                </Typography>
                            </TableCell>
                        </TableRow>
                    );
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