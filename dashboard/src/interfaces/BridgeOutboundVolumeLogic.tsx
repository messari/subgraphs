import { ApolloClient, gql, HttpLink, InMemoryCache, useLazyQuery } from "@apollo/client";
import { Box, CircularProgress, Grid, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { BridgeOutboundChart } from "../common/chartComponents/BridgeOutboundChart";
import { CopyLinkToClipboard } from "../common/utilComponents/CopyLinkToClipboard";
import { timestampToDaysSinceEpoch } from "../utils";

interface BridgeOutboundVolumeLogicProps {
    poolId: string;
    routes: string[];
    subgraphToQueryURL: string;
}

function BridgeOutboundVolumeLogic({
    poolId,
    routes,
    subgraphToQueryURL
}: BridgeOutboundVolumeLogicProps) {

    const routeIdToChainMapping: any = {};
    routes?.forEach((obj: any) => {
        routeIdToChainMapping[obj?.id] = obj?.crossToken?.network;
    })
    const routeIds = routes.map((x: any) => x.id);

    const routeSnapshotsQueryContent = routeIds.map((id: string) => {
        if (!id) {
            return "";
        }
        return `            
        ${routeIdToChainMapping[id]}: poolRouteSnapshots(where: {poolRoute: "${id}"}, first: 1000) {
            poolRoute {
                id
            }
            snapshotVolumeOutUSD
            timestamp
        }
        `;
    });

    const routeSnapshotsQuery = "query { " + routeSnapshotsQueryContent + " }";

    const client = useMemo(() => {
        return new ApolloClient({
            link: new HttpLink({
                uri: subgraphToQueryURL,
            }),
            cache: new InMemoryCache(),
        });
    }, [subgraphToQueryURL]);

    const [getSnapshotData, { data: snapshotData, loading, error }] = useLazyQuery(gql`${routeSnapshotsQuery}`, { client });

    useEffect(() => {
        if (routeSnapshotsQueryContent.length > 0) {
            getSnapshotData();
        }
    }, [routes])

    useEffect(() => {
        console.log('DATA: ', snapshotData, 'ERROR: ', error)
    }, [snapshotData, error])

    if (loading) {
        return (
            <div key={"BridgeOutboundChart"} id={"BridgeOutboundChart"}>
                <Box sx={{ width: "62.5%", marginBottom: "8px" }} mt={3}>
                    <CircularProgress size={40} />
                </Box>
            </div>);
    }

    if (error) {
        return <Typography variant="h6">{"Error Loading Chart: " + error.message}</Typography>;
    }

    // create object with all chains as keys, obj as child
    const chartingObject: any = {};
    const dates = [];
    if (snapshotData) {
        if (Object.keys(snapshotData).length > 0) {
            let earliestTS = Date.now();
            const chainMappingSnapshotDates: any = {};
            Object.keys(snapshotData).forEach((key: string) => {
                chainMappingSnapshotDates[key] = {};
                snapshotData[key].forEach((snapshot: any) => {
                    let ts = Number(snapshot.timestamp) * 1000;
                    if (ts < earliestTS) {
                        earliestTS = ts;
                    }
                    const dateString = timestampToDaysSinceEpoch(ts).toString();
                    if (!chainMappingSnapshotDates[key][dateString]) {
                        chainMappingSnapshotDates[key][dateString] = 0;
                    }
                    chainMappingSnapshotDates[key][dateString] += Number(snapshot.snapshotVolumeOutUSD);
                })
            })
            let daysSinceEpoch = timestampToDaysSinceEpoch(earliestTS);
            const todaySinceEpoch = timestampToDaysSinceEpoch(Date.now());
            // NEED TO LOG AND TEST ALL OF THESE TIMESTAMP VALUES
            for (daysSinceEpoch; daysSinceEpoch <= todaySinceEpoch; daysSinceEpoch++) {
                dates.push(daysSinceEpoch * 86400);
                Object.keys(chainMappingSnapshotDates).forEach((chain: string) => {
                    if (!Object.keys(chartingObject)?.includes(chain)) {
                        chartingObject[chain] = [];
                    }
                    chartingObject[chain].push(chainMappingSnapshotDates[chain][daysSinceEpoch] || 0);
                })
            }
        }
    }
    if (chartingObject) {
        if (Object.keys(chartingObject)?.length > 0) {
            return (<>
                <div key={"BridgeOutboundChart"} id={"BridgeOutboundChart"}>
                    <Box sx={{ width: "62.5%", marginBottom: "8px" }} mt={3}>
                        <Grid container justifyContent="space-between">
                            <CopyLinkToClipboard link={window.location.href} scrollId={"BridgeOutboundChart"}>
                                <Typography variant="h6">{"Daily Volume Inbound by Chain"}</Typography>
                            </CopyLinkToClipboard>
                        </Grid>
                    </Box>
                </div>
                <BridgeOutboundChart dayVolByChain={chartingObject} dates={dates} title={"Daily Volume Inbound by Chain for Pool " + poolId} />
            </>);
        }
    }
    return null;
}

export default BridgeOutboundVolumeLogic;
