import { ApolloClient, gql, HttpLink, InMemoryCache, useLazyQuery } from "@apollo/client";
import moment from "moment";
import { useEffect, useMemo, useState } from "react";

interface BridgeOutboundVolChartProps {
    poolId: string;
    routes: string[];
    subgraphToQueryURL: string;
}

function BridgeOutboundVolChart({
    poolId,
    routes,
    subgraphToQueryURL
}: BridgeOutboundVolChartProps) {

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

    // create object with all chains as keys, obj as child
    if (snapshotData) {
        if (Object.keys(snapshotData).length > 0) {
            console.log('Entered', Object.keys(snapshotData).length)
            let earliestTS = Date.now();
            const chainMappingSnapshotDates: any = {};
            Object.keys(snapshotData).forEach((key: string) => {
                chainMappingSnapshotDates[key] = {};
                snapshotData[key].forEach((snapshot: any) => {
                    if (Number(snapshot.timestamp) * 1000 < earliestTS) {
                        earliestTS = Number(snapshot.timestamp) * 1000;
                    }
                    const dateString = moment.utc(Number(snapshot.timestamp) * 1000).format("MM-DD-YYYY");
                    chainMappingSnapshotDates[key][dateString] = Number(snapshot.snapshotVolumeOutUSD);
                })
            })
            const chartingArray: any = [];
            let daysSinceEpoch = moment(moment.utc(earliestTS).format("MM-DD-YYYY")).unix() / 86400;
            const todaySinceEpoch = Date.now() / 86400;
            // NEED TO LOG AND TEST ALL OF THESE TIMESTAMP VALUES
            for (daysSinceEpoch; daysSinceEpoch <= todaySinceEpoch; daysSinceEpoch++) {
                const objToPushChartingArray: any = { date: moment(daysSinceEpoch).unix() };
                Object.keys(chainMappingSnapshotDates).forEach((chain: string) => {
                    const dateString = moment.utc(daysSinceEpoch * 86400).format("MM-DD-YYYY");
                    objToPushChartingArray[chain] = chainMappingSnapshotDates[chain][dateString] || 0;
                })
            }
        }
    }
    // map all snapshots and use timestamp utc mm-dd-yyyy strings as key, vol as value
    // upon mapping save the earliest timestamp (unix) thru all snapshots
    // Get the earliest unix timestamp and convert to days since unix
    // Create array where each element is an object with the timestamp and properties for each chain that will hold the vol on that date
    // start looping, incrementing number of days since unix
    // push obj to above array with timestamp property
    // convert days to mm-dd-yyyy string
    // For each chain key in object above, get the child value at key mm-dd-yyyy
    // in obj add key for chain and the child value (or 0)

    return null;
}

export default BridgeOutboundVolChart;
