import moment from "moment";
import {
  ApolloClient,
  HttpLink,
  InMemoryCache,
  NormalizedCacheObject,
} from "@apollo/client";
import { useEffect, useRef } from "react";

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
  "generic": "generic",
  "EXCHANGE": "exchanges",
  "LENDING": "lending",
  "YIELD": "vaults",
  "GENERIC": "generic"
}

export function JSONToCSVConvertor(JSONData: any, ReportTitle: string, ShowLabel: string) {
  try {
    const arrData = typeof JSONData != 'object' ? JSON.parse(JSONData) : JSONData;
    let CSV = '';
    if (ShowLabel) {
      let row = "";
      for (let index in arrData[0]) {
        row += index + ',';
      }
      row = row.slice(0, -1);
      CSV += row + '\r\n';
    }

    for (let i = 0; i < arrData.length; i++) {
      let row = "";
      for (let index in arrData[i]) {
        row += '"' + arrData[i][index] + '",';
      }
      row.slice(0, row.length - 1);
      CSV += row + '\r\n';
    }

    if (CSV === '') {
      return;
    }

    const csv = CSV;
    const blob = new Blob([csv], { type: 'text/csv' });
    const csvUrl = window.webkitURL.createObjectURL(blob);
    const filename = (ReportTitle || 'UserExport') + '.csv';
    return { csvUrl, filename };
  } catch (err: any) {
    console.error(err.message);
    return { csvURL: "", filename: "" };
  }
}

export function downloadCSV(data: any[], label: string, identifier: string) {
  try {
    const link = document.createElement('a');
    const field = label.split("-")[1] || label;
    let freq = label.split("-")[0]?.toUpperCase()?.includes("HOURLY") ? "hourly-" : "";
    if (label.split("-")[0]?.toUpperCase()?.includes("DAILY")) {
      freq = "daily-";
    }
    if (field?.toUpperCase()?.includes("DAILY") || field?.toUpperCase()?.includes("HOURLY")) {
      freq = "";
    }
    link.download = identifier + '-' + freq + field + "-" + moment.utc(Date.now()).format("MMDDYY") + ".csv";
    const csvEle = JSONToCSVConvertor(data, label + '-csv', label);
    if (!csvEle?.csvUrl) {
      throw new Error("csv File not constructed");
    } else {
      link.href = csvEle?.csvUrl;
      link.click();
    }
  } catch (err: any) {
    console.error(err.message);
    return;
  }
}

export function base64toBlobJPEG(dataURI: string) {
  try {
    const byteString = atob(dataURI.split(',')[1]);
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const integerArray = new Uint8Array(arrayBuffer);

    for (let i = 0; i < byteString.length; i++) {
      integerArray[i] = byteString.charCodeAt(i);
    }
    return new Blob([arrayBuffer], { type: 'image/jpeg' });
  } catch (err: any) {
    console.error(err.message);
    return;
  }
}
