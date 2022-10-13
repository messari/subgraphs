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

export const toUnitsSinceEpoch = (dateStr: string, hour: boolean) => {
  const timestamp = moment.utc(dateStr).unix();
  if (hour) {
    return (timestamp / 3600).toFixed(0);
  }
  return (timestamp / 86400).toFixed(0);
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

export const formatIntToFixed2 = (val: number): string => {
  let returnStr = parseFloat(val.toFixed(2)).toLocaleString();
  if (returnStr.split(".")[1]?.length === 1) {
    returnStr += "0";
  } else if (!returnStr.split(".")[1]?.length) {
    returnStr += ".00";
  }
  return returnStr;
};

export const schemaMapping: { [x: string]: any } = {
  "dex-amm": "exchanges",
  "yield-aggregator": "vaults",
  "lending": "lending",
  "generic": "generic"
}