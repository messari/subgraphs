import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { SubgraphLogo } from "../common/SubgraphLogo";
import { NetworkLogo } from "../common/NetworkLogo";

interface DeploymentsInDevelopment {
    deploymentsInDevelopment: { [x: string]: any };
}

function DeploymentsInDevelopment({ deploymentsInDevelopment }: DeploymentsInDevelopment) {

    const columnLabels: string[] = [
        "Name/Network",
        "Schema Version",
        "Subgraph Version",
        "Methodology Version"
    ];

    const tableHead = (
        <TableHead sx={{ height: "20px" }}>
            <TableRow sx={{ height: "20px" }}>
                {columnLabels.map((x, idx) => {
                    let textAlign = "left";
                    if (idx !== 0) {
                        textAlign = "right";
                    }
                    return (
                        <TableCell key={"column" + x}>
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
            if (deploymentData?.status === 'dev') {
                deposInProgressCount += 1;
                if (!Object.keys(deposInProgress).includes(protocol.schema)) {
                    deposInProgress[protocol.schema] = {};
                }
                if (!Object.keys(deposInProgress[protocol.schema]).includes(protocolName)) {
                    deposInProgress[protocol.schema][protocolName] = { schemaVersions: [], subgraphVersions: [], methodologyVersions: [], networks: [] };
                }
                deposInProgress[protocol.schema][protocolName].networks.push(deploymentData.network);
                if (!deposInProgress[protocol.schema][protocolName]?.methodologyVersions?.includes(deploymentData?.versions?.methodology)) {
                    deposInProgress[protocol.schema][protocolName]?.methodologyVersions?.push(deploymentData?.versions?.methodology);
                }
                if (!deposInProgress[protocol.schema][protocolName]?.subgraphVersions?.includes(deploymentData?.versions?.subgraph)) {
                    deposInProgress[protocol.schema][protocolName]?.subgraphVersions?.push(deploymentData?.versions?.subgraph);
                }
                if (!deposInProgress[protocol.schema][protocolName]?.schemaVersions?.includes(deploymentData?.versions?.schema)) {
                    deposInProgress[protocol.schema][protocolName]?.schemaVersions?.push(deploymentData?.versions?.schema);
                }
            }
        })
    })

    return (
        <>
            <Typography variant="h4" align="center" sx={{ my: 4 }}>
                Subgraphs Currently In Development ({deposInProgressCount}/{totalDepoCounter})
            </Typography>
            {Object.entries(deposInProgress).map(([schemaType, subgraph]) => {
                const tableRows = Object.keys(subgraph).map((subgraphName) => {
                    const protocol = subgraph[subgraphName];
                    return (
                        <TableRow sx={{ height: "10px", width: "100%", backgroundColor: "rgba(22,24,29,0.9)" }}>
                            <TableCell
                                sx={{ padding: "0", borderLeft: `orange solid 6px`, verticalAlign: "middle", display: "flex" }}
                            >
                                {!subgraphName.includes('evm') && !subgraphName.includes('erc721') ? <SubgraphLogo name={subgraphName} size={30} /> : null}
                                <span style={{ display: "inline-flex", alignItems: "center", padding: "0px 10px", fontSize: "14px" }}>
                                    {subgraphName}
                                </span>
                                {protocol.networks.map((x: string) => <NetworkLogo size={30} network={x} />)}
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
