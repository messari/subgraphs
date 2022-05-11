import moment from "moment";
import { ApolloClient, HttpLink, InMemoryCache, NormalizedCacheObject } from "@apollo/client";

export const toDate = (timestamp: number) => {
  return moment.unix(timestamp).format("YYYY-MM-DD");
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

export function convertTokenDecimals(value: string, decimals: number): number {
  if (isNaN(Number(value))) {
    return 0;
  }
  const divisor = 10 ** decimals;
  return Number(value) / divisor;
}

export const parseSubgraphName = (url: string) => {
  const result = new RegExp(/\/name\/(.*)/g).exec(url);
  return result ? result[1] : "";
};