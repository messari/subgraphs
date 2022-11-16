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

export function csvToJSONConvertorMultiCol(lines: string[], headers: string[]) {
  const invalidColumns = [".", "..", "...", ",", "-", "_", " ", '"', "'"];
  try {
    if (!(headers.length >= 2) || (!headers.map(x => x?.toLowerCase()).includes('date') && !headers.map(x => x?.toLowerCase()).includes('time'))) {
      return 'Wrong CSV data format. The CSV must have multiple columns, one must be a "date" column.';
    }
    const obj: any = {};
    for (let i = 1; i < lines.length; i++) {
      const currentline = lines[i].split(",");
      for (let j = 0; j < headers.length; j++) {
        let entry: any = currentline[j];
        let header = headers[j].toLowerCase();
        if (!invalidColumns.includes(header)) {
          if (header === "time") {
            header = "date";
          }
          header = header.split("  ").join(" ");
          if (entry) {
            if (!obj[header]) {
              obj[header] = [];
            }
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
            obj[header].push(entry);
          }
        }
      }
    }
    return (obj);
  } catch (err: any) {
    console.error(err.message);
    return "csvToJSONConvertor encountered an JS error while processing: " + err?.message + ".";
  }
}

export function csvToJSON2Col(lines: string[], headers: string[]) {
  const result = [];
  try {
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

export function csvToJSONConvertor(csv: string, isEntityLevel: boolean) {
  try {
    const lines = csv.split("\n");
    const headers = lines[0].split(",").map(x => x?.includes('\r') ? x.split('\r').join("") : x);
    let result: any = null
    if (headers.length === 2 && !isEntityLevel) {
      result = csvToJSON2Col(lines, headers);
    }
    if (headers.length > 2 || (headers.length === 2 && isEntityLevel)) {
      result = csvToJSONConvertorMultiCol(lines, headers);
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

export function lineupChartDatapoints(compChart: any) {
  const key1 = Object.keys(compChart)[0];
  const key2 = Object.keys(compChart)[1];

  const arrLocal1 = compChart[key1].sort((a: any, b: any) => a.date - b.date);
  const arrLocal2 = compChart[key2].sort((a: any, b: any) => a.date - b.date);

  function shiftStartDates(arr1: any[], arr2: any[]): any {
    const prop1StartDate = arr1[0]?.date;
    const prop2StartDate = arr2[0]?.date;

    if (!prop1StartDate || !prop2StartDate) {

    }

    if (prop1StartDate > prop2StartDate) {
      const arr2Index = arr2.findIndex((x: any) => x.date >= prop1StartDate - 86400);
      arr2 = arr2.slice(arr2Index);
    } else if (prop1StartDate < prop2StartDate) {
      const arr1Index = arr1.findIndex((x: any) => x.date >= prop2StartDate - 86400);
      arr1 = arr1.slice(arr1Index);
    }
    return { [key1]: arr1, [key2]: arr2 };
  }

  const matchedStartDatesCompChart = shiftStartDates(arrLocal1, arrLocal2);
  return matchedStartDatesCompChart;
}

export function upperCaseFirstOfString(str: string) {
  const arr = str.split("");
  arr[0] = arr[0].toUpperCase();
  return arr.join("");
}