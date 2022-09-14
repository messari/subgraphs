import { SubgraphDeployments } from "./SubgraphDeployments";
import { ApolloClient, NormalizedCacheObject } from "@apollo/client";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import Placeholder from "./Placeholder";
import LazyLoad from "react-lazyload";
import { DecentralizedNetworkRow } from "./DecentralizedNetworkRow";
import { SubgraphLogo } from "../common/SubgraphLogo";
import { NetworkLogo } from "../common/NetworkLogo";

interface DeploymentsInDevelopment {
    deploymentsInDevelopment: { [x: string]: any };
    showDeploymentsInDevelopment: boolean;
}

function DeploymentsInDevelopment({ deploymentsInDevelopment, showDeploymentsInDevelopment }: DeploymentsInDevelopment) {
    if (!showDeploymentsInDevelopment) return null;

    const columnLabels: string[] = [
        "Name/Network",
        "Schema Version",
        "Subgraph Version"
    ];

    const tableHead = (
        <TableHead sx={{ height: "30px" }}>
            <TableRow sx={{ height: "30px" }}>
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

    const deposInProgress: { [x: string]: any } = {};
    Object.entries(deploymentsInDevelopment).forEach(([protocolName, protocol]) => {
        Object.keys(protocol.deployments).forEach((depoKey) => {
            const deploymentData: any = protocol.deployments[depoKey];
            if (deploymentData?.status === 'dev') {
                deposInProgress[depoKey] = deploymentData;
                deposInProgress[depoKey].subgraphID = protocolName;
            }
        })
    })

    let loadedTableBody = (
        <>
            {Object.entries(deposInProgress).map(([subgraphName, protocol]) => {
                return (
                    <TableRow sx={{ width: "100%", backgroundColor: "rgba(22,24,29,0.9)" }}>
                        <TableCell
                            sx={{ padding: "6px", borderLeft: `orange solid 6px`, verticalAlign: "middle", display: "flex" }}
                        >
                            {!protocol.subgraphID.includes('evm') && !protocol.subgraphID.includes('erc721') ? <SubgraphLogo name={protocol.subgraphID} /> : null}
                            <NetworkLogo network={protocol.network} />
                            <span style={{ display: "inline-flex", alignItems: "center", paddingLeft: "6px", fontSize: "14px" }}>
                                {subgraphName}
                            </span>
                        </TableCell>
                        <TableCell sx={{ padding: "6px", textAlign: "right" }}>
                            <Typography variant="h5" sx={{ width: "100%" }} fontSize={14}>
                                {protocol?.versions?.schema || "N/A"}
                            </Typography>
                        </TableCell>
                        <TableCell sx={{ padding: "6px", textAlign: "right" }}>
                            <Typography variant="h5" sx={{ width: "100%" }} fontSize={14}>
                                {protocol?.versions?.subgraph || "N/A"}
                            </Typography>
                        </TableCell>
                    </TableRow>
                );
            })}
        </>
    );

    return (
        <>
            <Typography variant="h4" align="center" sx={{ my: 4 }}>
                Subgraphs Currently Under Development
            </Typography>
            <TableContainer>
                <Table stickyHeader>
                    {tableHead}
                    <TableBody>{loadedTableBody}</TableBody>
                </Table>
            </TableContainer>
        </>
    );
}

export default DeploymentsInDevelopment;
