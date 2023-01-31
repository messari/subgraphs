import { ApolloClient, gql, HttpLink, InMemoryCache, useLazyQuery } from "@apollo/client";
import { Box, CircularProgress, Grid, Typography } from "@mui/material";
import moment from "moment";
import { useEffect, useMemo, useRef } from "react";
import { BridgeOutboundChart } from "../common/chartComponents/BridgeOutboundChart";
import { DynamicColumnTableChart } from "../common/chartComponents/DynamicColumnTableChart";
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
    const chartRef = useRef<any>(null);
    const datasetLabel = "Daily Volume Inbound by Chain";
    function jpegDownloadHandler() {
        try {
            const link = document.createElement('a');
            link.download = datasetLabel + '-' + moment.utc(Date.now()).format("MMDDYY") + ".jpeg";
            link.href = chartRef.current?.toBase64Image('image/jpeg', 1);
            link.click();
        } catch (err) {
            return;
        }
    }
    const routeIdToChainMapping: any = {};
    routes?.forEach((obj: any) => {
        routeIdToChainMapping[obj?.id] = obj?.crossToken?.network;
    })
    const routeIds = routes?.map((x: any) => x?.id);

    const routeSnapshotsQueryContent = routeIds?.map((id: string) => {
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
    }) || "";

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
    const tableVals: { value: any; date: any }[] = [];

    const dates = [];
    if (snapshotData) {
        if (Object.keys(snapshotData).length > 0) {
            let earliestTS = Date.now();
            const chainMappingSnapshotDates: any = {};
            const snapshotDataOnDate: any = {};
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
                    if (!snapshotDataOnDate[dateString]) {
                        snapshotDataOnDate[dateString] = {};
                    }
                })
            })
            let daysSinceEpoch = timestampToDaysSinceEpoch(earliestTS);
            const todaySinceEpoch = timestampToDaysSinceEpoch(Date.now());
            // NEED TO LOG AND TEST ALL OF THESE TIMESTAMP VALUES
            for (daysSinceEpoch; daysSinceEpoch <= todaySinceEpoch; daysSinceEpoch++) {
                dates.push(daysSinceEpoch * 86400);
                const tableValsElement: any = { date: daysSinceEpoch * 86400 };
                Object.keys(chainMappingSnapshotDates).forEach((chain: string) => {
                    if (!Object.keys(chartingObject)?.includes(chain)) {
                        chartingObject[chain] = [];
                    }
                    const currentVal = chainMappingSnapshotDates[chain][daysSinceEpoch] || 0;
                    chartingObject[chain].push(currentVal);
                    tableValsElement[chain] = currentVal;
                });
                tableVals.push(tableValsElement);
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
                                <Typography variant="h6">{datasetLabel}</Typography>
                            </CopyLinkToClipboard>
                        </Grid>
                    </Box>
                </div>
                <Grid container justifyContent="space-between">
                    <Grid key={datasetLabel + "chart1"} item xs={7.5}>
                        <BridgeOutboundChart dayVolByChain={chartingObject} dates={dates} title={"Daily Volume Inbound by Chain for Pool " + poolId} chartRef={chartRef} />
                    </Grid>
                    <Grid key={datasetLabel + "table2"} item xs={4}>
                        <DynamicColumnTableChart datasetLabel={datasetLabel} dataTable={tableVals} jpegDownloadHandler={() => jpegDownloadHandler()} />
                    </Grid>
                </Grid>
            </>);
        }
    }
    return null;
}

export default BridgeOutboundVolumeLogic;
