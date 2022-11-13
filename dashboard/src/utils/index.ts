import moment from "moment";
import {
  ApolloClient,
  HttpLink,
  InMemoryCache,
  NormalizedCacheObject,
} from "@apollo/client";
import { useEffect, useRef } from "react";

export const tableCellTruncate: any = {
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
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

export function toDate(timestamp: number, hour: boolean = false) {
  let formatString = "YYYY-MM-DD";
  if (hour) {
    formatString += " HH:mm";
  }
  return moment.utc(timestamp * 1000).format(formatString);
};

export function toUnitsSinceEpoch(dateStr: string, hour: boolean) {
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

export function parseSubgraphName(url: string) {
  const result = new RegExp(/\/name\/(.*)/g).exec(url);
  return result ? result[1] : "";
};

export function toPercent(cur: number, total: number): number {
  return parseFloat(((cur / total) * 100).toFixed(2));
}

export function formatIntToFixed2(val: number): string {
  let returnStr = parseFloat(val.toFixed(2)).toLocaleString();
  if (returnStr.split(".")[1]?.length === 1) {
    returnStr += "0";
  } else if (!returnStr.split(".")[1]?.length) {
    returnStr += ".00";
  }
  return returnStr;
};

export function csvToJSONConvertor(csv: string) {
  try {
    const lines = csv.split("\n");
    const result = [];
    const headers = lines[0].split(",");
    if (headers.length !== 2 || !headers.map(x => x?.toLowerCase()).includes('date')) {
      return 'Wrong CSV data format. The CSV must have two columns, one must be a "date" column.';
    }
    for (let i = 1; i < lines.length; i++) {
      const obj: any = {};
      const currentline = lines[i].split(",");
      for (let j = 0; j < headers.length; j++) {
        let entry: any = currentline[j];
        let header = headers[j].toLowerCase();
        if (header !== 'date') {
          header = 'value';
        }
        if (entry) {
          if (entry.includes("'")) {
            entry = entry.split("'").join("");
          }
          if (entry.includes('"')) {
            entry = entry.split('"').join("");
          }
          if (header === 'date' && isNaN(entry)) {
            entry = moment(entry).unix();
          }
          if (!isNaN(Number(entry))) {
            entry = Number(entry);
          }
          obj[header] = entry;
        }
      }
      if (Object.keys(obj)?.length === 2) {
        result.push(obj);
      }
    }
    return (result);
  } catch (err: any) {
    console.error(err.message);
    return "csvToJSONConvertor encountered an JS error while processing: " + err?.message + ".";
  }
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

export function downloadCSV(data: any, label: string, identifier: string) {
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

export function lineupChartDatapoints(compChart: any, stitchLeftIndex: number, timeKey: string = 'date') {
  const key1 = Object.keys(compChart)[0];
  const key2 = Object.keys(compChart)[1];
  while (toDate(compChart[key1][stitchLeftIndex][timeKey]) !== toDate(compChart[key2][stitchLeftIndex][timeKey])) {
    if (compChart[key1][stitchLeftIndex][timeKey] < compChart[key2][stitchLeftIndex][timeKey]) {
      const startIndex = compChart[key1].findIndex((x: any) => x[timeKey] >= compChart[key2][stitchLeftIndex][timeKey]);
      let newArray = [...compChart[key1].slice(startIndex)];
      if (stitchLeftIndex > 0) {
        newArray = [...compChart[key1].slice(0, stitchLeftIndex), ...compChart[key1].slice(startIndex, compChart[key1].length)];
      }
      compChart[key1] = newArray;
    } else {
      const startIndex = compChart[key2].findIndex((x: any) => x[timeKey] >= compChart[key1][stitchLeftIndex][timeKey]);
      let newArray = [...compChart[key2].slice(startIndex)];
      if (stitchLeftIndex > 0) {
        newArray = [...compChart[key2].slice(0, stitchLeftIndex), ...compChart[key2].slice(startIndex, compChart[key2].length)];
      }
      compChart[key2] = newArray;
    }
  }
  return compChart;
}

export function upperCaseFirstOfString(str: string) {
  const arr = str.split("");
  arr[0] = arr[0].toUpperCase();
  return arr.join("");
}
