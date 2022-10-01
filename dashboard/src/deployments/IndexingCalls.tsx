import { styled } from "../styled";
import { NewClient } from "../utils";
import { useEffect, useMemo } from "react";
import { gql, useLazyQuery } from "@apollo/client";

const DeploymentsLayout = styled("div")`
  padding: 0;
`;

interface IndexingCallsProps {
    setIndexingStatus: any;
    setPendingIndexingStatus: any;
    indexingStatusQueries: any;
    setIndexingStatusLoaded: any;
    setIndexingStatusLoadedPending: any;
    setIndexingStatusError: any;
    setIndexingStatusErrorPending: any;
    indexingStatusLoaded: any;
    indexingStatusLoadedPending: any;
    indexingStatusError: any;
    indexingStatusErrorPending: any;
}

function IndexingCalls({ setIndexingStatus, setPendingIndexingStatus, indexingStatusQueries, setIndexingStatusLoaded, setIndexingStatusLoadedPending, setIndexingStatusError, setIndexingStatusErrorPending, indexingStatusLoaded, indexingStatusLoadedPending, indexingStatusError, indexingStatusErrorPending }: IndexingCallsProps) {
    const clientIndexing = useMemo(() => NewClient("https://api.thegraph.com/index-node/graphql"), []);
    let currentLendingQuery = indexingStatusQueries?.lending?.fullCurrentQueryArray?.join("");
    let currentDexAmmQuery = indexingStatusQueries?.exchanges?.fullCurrentQueryArray?.join("");
    let currentYieldAggQuery = indexingStatusQueries?.vaults?.fullCurrentQueryArray?.join("");
    let currentGenericQuery = indexingStatusQueries?.generic?.fullCurrentQueryArray?.join("");


    // Generate query from subgraphEndpoints
    const [fetchStatusLending, {
        data: statusLending,
        loading: statusLendingLoading,
        error: statusLendingError
    }] = useLazyQuery(gql`${currentLendingQuery}`, {
        client: clientIndexing,
    });

    const [fetchStatusDexAmm, {
        data: statusDexAmm,
        loading: statusDexAmmLoading,
        error: statusDexAmmError
    }] = useLazyQuery(gql`${currentDexAmmQuery}`, {
        client: clientIndexing,
    });

    const [fetchStatusYield, {
        data: statusYield,
        loading: statusYieldLoading,
        error: statusYieldError
    }] = useLazyQuery(gql`${currentYieldAggQuery}`, {
        client: clientIndexing,
    });

    const [fetchStatusGeneric, {
        data: statusGeneric,
        loading: statusGenericLoading,
        error: statusGenericError
    }] = useLazyQuery(gql`${currentGenericQuery}`, {
        client: clientIndexing,
    });

    let pendingLendingQuery = indexingStatusQueries?.lending?.fullPendingQueryArray?.join("");
    let pendingDexAmmQuery = indexingStatusQueries?.exchanges?.fullPendingQueryArray?.join("");
    let pendingYieldAggQuery = indexingStatusQueries?.vaults?.fullPendingQueryArray?.join("");
    let pendingGenericQuery = indexingStatusQueries?.generic?.fullPendingQueryArray?.join("");

    const [fetchStatusLendingPending, {
        data: statusLendingPending,
        loading: statusLendingPendingLoading,
        error: statusLendingPendingError
    }] = useLazyQuery(gql`${pendingLendingQuery}`, {
        client: clientIndexing,
    });

    const [fetchStatusDexAmmPending, {
        data: statusDexAmmPending,
        loading: statusDexAmmPendingLoading,
        error: statusDexAmmPendingError
    }] = useLazyQuery(gql`${pendingDexAmmQuery}`, {
        client: clientIndexing,
    });

    const [fetchStatusYieldPending, {
        data: statusYieldPending,
        loading: statusYieldPendingLoading,
        error: statusYieldPendingError
    }] = useLazyQuery(gql`${pendingYieldAggQuery}`, {
        client: clientIndexing,
    });

    const [fetchStatusGenericPending, {
        data: statusGenericPending,
        loading: statusGenericPendingLoading,
        error: statusGenericPendingError
    }] = useLazyQuery(gql`${pendingGenericQuery}`, {
        client: clientIndexing,
    });

    useEffect(() => {
        fetchStatusLending();
        fetchStatusDexAmm();
        fetchStatusYield();
        fetchStatusGeneric();
        fetchStatusLendingPending();
        fetchStatusDexAmmPending();
        fetchStatusYieldPending();
        fetchStatusGenericPending();
    }, [])

    useEffect(() => {
        if (statusLending && statusDexAmm && statusYield && statusGeneric) {
            setIndexingStatus({ ...statusLending, ...statusDexAmm, ...statusYield, ...statusGeneric });
        }
    }, [statusLending, statusDexAmm, statusYield, statusGeneric])

    useEffect(() => {
        if (statusLendingPending && statusDexAmmPending && statusYieldPending && statusGenericPending) {
            setPendingIndexingStatus({ ...statusLendingPending, ...statusDexAmmPending, ...statusYieldPending, ...statusGenericPending });
        }
    }, [statusLendingPending, statusDexAmmPending, statusYieldPending, statusGenericPending])

    useEffect(() => {
        if ((statusLending || statusLendingError) && (statusDexAmm || statusDexAmmError) && (statusYield || statusYieldError) && (statusGeneric || statusGenericError)) {
            setIndexingStatusLoaded({ lending: true, exchanges: true, vaults: true, generic: true });
            const newErrorObject = { ...indexingStatusError };
            if (statusLendingError && !indexingStatusError.lending) {
                newErrorObject.lending = true;
            }
            if (statusDexAmmError && !indexingStatusError.exchanges) {
                newErrorObject.exchanges = true;
            }
            if (statusYieldError && !indexingStatusError.vaults) {
                newErrorObject.vaults = true;
            }
            if (statusGenericError && !indexingStatusError.generic) {
                newErrorObject.generic = true;
            }
            setIndexingStatusError(newErrorObject);
        }
    }, [statusLendingLoading, statusDexAmmLoading, statusYieldLoading, statusGenericLoading]);


    useEffect(() => {
        if ((statusLendingPending || statusLendingPendingError) && (statusDexAmmPending || statusDexAmmPendingError) && (statusYieldPending || statusYieldPendingError) && (statusGenericPending || statusGenericPendingError)) {
            setIndexingStatusLoadedPending({ lending: true, exchanges: true, vaults: true, generic: true });
            const newErrorObject = { ...indexingStatusErrorPending };
            if (statusLendingPendingError && !indexingStatusErrorPending.lending) {
                newErrorObject.lending = true;
            }
            if (statusDexAmmPendingError && !indexingStatusErrorPending.exchanges) {
                newErrorObject.exchanges = true;
            }
            if (statusYieldPendingError && !indexingStatusErrorPending.vaults) {
                newErrorObject.vaults = true;
            }
            if (statusGenericPendingError && !indexingStatusErrorPending.generic) {
                newErrorObject.generic = true;
            }
            setIndexingStatusErrorPending(newErrorObject);
        }
    }, [statusLendingPendingLoading, statusDexAmmPendingLoading, statusYieldPendingLoading, statusGenericPendingLoading]);

    // No need to return a JSX element to render, function needed for state management
    return (null);
}

export default IndexingCalls;