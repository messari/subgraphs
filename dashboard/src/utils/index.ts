import moment from "moment";
import {
  ApolloClient,
  ApolloError,
  gql,
  HttpLink,
  InMemoryCache,
  LazyQueryResult,
  NormalizedCacheObject,
  QueryTuple,
  useLazyQuery,
} from "@apollo/client";
import { useEffect, useRef, useState } from "react";

export const toDate = (timestamp: number, hour: boolean = false) => {
  let formatString = "YYYY-MM-DD";
  if (hour) {
    formatString += " HH:mm";
  }
  return moment.utc(timestamp * 1000).format(formatString);
};

export function isValidHttpUrl(s: string) {
  let url;
  try {
    url = new URL(s);
  } catch (_) {
    return false;
  }

  return url.protocol === "http:" || url.protocol === "https:";
}

export function NewClient(url: string): ApolloClient<NormalizedCacheObject> {
  const link = new HttpLink({
    uri: url,
  });
  return new ApolloClient({
    link,
    cache: new InMemoryCache(),
  });
}

export function useInterval(callback: any, delay: number) {
  const savedCallback = useRef<any>();

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval.
  useEffect(() => {
    function tick() {
      if (savedCallback) {
        savedCallback?.current();
      }
    }
    if (delay !== null) {
      let id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

export function convertTokenDecimals(value: string, decimals: number): number {
  if (isNaN(Number(value)) || !decimals || Number(value) === 0) {
    return 0;
  }
  const divisor = 10 ** decimals;
  if (!(Number(value) / divisor)) {
    return 0;
  }
  return Number(value) / divisor;
}

export const parseSubgraphName = (url: string) => {
  const result = new RegExp(/\/name\/(.*)/g).exec(url);
  return result ? result[1] : "";
};

export const toPercent = (cur: number, total: number): number => parseFloat(((cur / total) * 100).toFixed(2));

// export default function useRetryableQuery(query: string, options: { [x: string]: any } = {}) {
//   const [refetchError, setRefetchError] = useState<ApolloError | undefined>(undefined);
//   const result: Promise<LazyQueryResult<TData, TVariables>> = useLazyQuery(gql`${query}`, options);
//   const variables = options.variables || {};
//   useEffect(() => {
//     setRefetchError(undefined);
//   }, Object.values(variables));
//   return {
//     ...result,
//     networkStatus: refetchError ? 8 : result.networkStatus,
//     error: refetchError || result.error,
//     refetch: () => {
//       setRefetchError(undefined);
//       return result.refetch().catch((err: any) => {
//         setRefetchError(err);
//         return Promise.reject(err);
//       });
//     },
//   };
// }
