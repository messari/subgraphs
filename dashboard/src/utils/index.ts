import moment from "moment";
import { ApolloClient, HttpLink, InMemoryCache, NormalizedCacheObject } from "@apollo/client";
import { useEffect, useRef } from "react";

export const tableCellTruncate: any = {
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

export const schemaMapping: { [x: string]: any } = {
  exchanges: "exchanges",
  vaults: "vaults",
  "dex-amm": "exchanges",
  "yield-aggregator": "vaults",
  lending: "lending",
  generic: "generic",
  bridge: "bridge",
  bridges: "bridge",
  EXCHANGES: "exchanges",
  VAULTS: "vaults",
  "DEX-AMM": "exchanges",
  "YIELD-AGGREGATOR": "vaults",
  LENDING: "lending",
  GENERIC: "generic",
  EXCHANGE: "exchanges",
  YIELD: "vaults",
  BRIDGE: "bridge",
  BRIDGES: "bridge",
  erc20: "erc20",
  erc721: "erc721",
  governance: "governance",
  network: "network",
  "nft-marketplace": "nft-marketplace",
  "derivatives-options": "derivatives-options",
  OPTION: "derivatives-options",
  "derivatives-perpfutures": "derivatives-perpfutures",
  PERPETUAL: "derivatives-perpfutures",
};

export function toDate(timestamp: number, hour: boolean = false) {
  let formatString = "YYYY-MM-DD";
  if (hour) {
    formatString += " HH:mm";
  }
  return moment.utc(timestamp * 1000).format(formatString);
}

export function toUnitsSinceEpoch(dateStr: string, hour: boolean) {
  const timestamp = moment.utc(dateStr).unix();
  if (hour) {
    return Math.round(timestamp / 3600).toString();
  }
  return Math.round(timestamp / 86400).toString();
}

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
}

export function toPercent(cur: number, total: number): number {
  return parseFloat(((cur / total) * 100).toFixed(2));
}

export function timestampToDaysSinceEpoch(ts: number): number {
  if (ts > 20000000000) {
    ts = ts / 1000;
  }
  let days = (ts / 86400).toString();

  if (days.includes(".")) {
    const tsSplit = days.split("");
    const tenthElement = tsSplit[tsSplit.indexOf(".") + 1];
    if (Number(tenthElement) >= 5) {
      days = (Number(days.split(".")[0]) + 1).toFixed(0);
    } else {
      days = Number(days).toFixed(0);
    }
  }
  return Number(days);
}

export function formatIntToFixed2(val: number): string {
  let returnStr = parseFloat(val.toFixed(2)).toLocaleString();
  if (returnStr.split(".")[1]?.length === 1) {
    returnStr += "0";
  } else if (!returnStr.split(".")[1]?.length) {
    returnStr += ".00";
  }
  if (returnStr.includes("NaN")) {
    returnStr = "0.00";
  }
  return returnStr;
}

export function csvToJSONConvertorMultiCol(lines: string[], headers: string[], mmddyyyy: boolean = true): any {
  const invalidColumns = [".", "..", "...", ",", "-", "_", " ", '"', "'"];
  try {
    if (
      !(headers.length >= 2) ||
      (!headers.map((x) => x?.toLowerCase()).includes("date") && !headers.map((x) => x?.toLowerCase()).includes("time"))
    ) {
      throw new Error('Wrong CSV data format. The CSV must have multiple columns, one must be a "date" column.');
    }
    const obj: any = {};
    let returnRecursion = false;
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
            if (header === "date" && isNaN(entry)) {
              if (isNaN(moment(entry).unix()) && mmddyyyy) {
                returnRecursion = true;
              } else {
                if (mmddyyyy) {
                  entry = moment(entry).unix();
                } else {
                  entry = moment(entry, "DD/MM/YYYY").unix();
                }
              }
            }
            if (!isNaN(Number(entry))) {
              entry = Number(entry);
            }
            obj[header].push(entry);
          }
        }
      }
    }
    if (returnRecursion) {
      return csvToJSONConvertorMultiCol(lines, headers, false);
    }
    return obj;
  } catch (err: any) {
    console.error(err.message);
    return err;
  }
}

export function csvToJSONConvertorTwoCol(lines: string[], headers: string[], mmddyyyy: boolean = true): any {
  const result = [];
  try {
    if (headers.length !== 2 || !headers.map((x) => x?.toLowerCase()).includes("date")) {
      throw new Error('Wrong CSV data format. The CSV must have two columns, one must be a "date" column.');
    }
    let returnRecursion = false;
    for (let i = 1; i < lines.length; i++) {
      const obj: any = {};
      const currentline = lines[i].split(",");
      for (let j = 0; j < headers.length; j++) {
        let entry: any = currentline[j];
        let header = headers[j].toLowerCase();
        if (header !== "date") {
          header = "value";
        }
        if (entry) {
          if (entry.includes("'")) {
            entry = entry.split("'").join("");
          }
          if (entry.includes('"')) {
            entry = entry.split('"').join("");
          }
          if (header === "date" && isNaN(entry)) {
            if (isNaN(moment(entry).unix()) && mmddyyyy) {
              returnRecursion = true;
            } else {
              if (mmddyyyy) {
                entry = moment(entry).unix();
              } else {
                entry = moment(entry, "DD/MM/YYYY").unix();
              }
            }
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
    if (returnRecursion) {
      return csvToJSONConvertorTwoCol(lines, headers, false);
    }
    return result;
  } catch (err: any) {
    console.error(err.message);
    return err;
  }
}

export function csvToJSONConvertor(csv: string, isEntityLevel: boolean) {
  try {
    const lines = csv.split("\n");
    const headers = lines[0].split(",").map((x) => (x?.includes("\r") ? x.split("\r").join("") : x));
    let result: any = null;
    if (headers.length === 2 && !isEntityLevel) {
      result = csvToJSONConvertorTwoCol(lines, headers);
    }
    if (headers.length > 2 || (headers.length === 2 && isEntityLevel)) {
      result = csvToJSONConvertorMultiCol(lines, headers);
    }
    if (result instanceof Error) {
      throw result;
    }
    return result;
  } catch (err: any) {
    console.error(err.message);
    return new Error("csvToJSONConvertor encountered an JS error while processing: " + err?.message + ".");
  }
}

export function JSONToCSVConvertor(JSONData: any, ReportTitle: string, ShowLabel: string) {
  try {
    const arrData = typeof JSONData != "object" ? JSON.parse(JSONData) : JSONData;
    let CSV = "";
    if (ShowLabel) {
      let row = "";
      for (let index in arrData[0]) {
        row += index + ",";
      }
      row = row.slice(0, -1);
      CSV += row + "\r\n";
    }

    for (let i = 0; i < arrData.length; i++) {
      let row = "";
      for (let index in arrData[i]) {
        row += '"' + arrData[i][index] + '",';
      }
      row.slice(0, row.length - 1);
      CSV += row + "\r\n";
    }

    if (CSV === "") {
      return;
    }

    const csv = CSV;
    const filename = (ReportTitle || "UserExport") + ".csv";
    const blob = new Blob([csv], { type: "text/csv" });
    const csvUrl = window.webkitURL.createObjectURL(blob);
    return { csvUrl, filename };
  } catch (err: any) {
    console.error(err.message);
    return { csvURL: "", filename: "" };
  }
}

export function downloadCSV(data: any, label: string, identifier: string) {
  try {
    const link = document.createElement("a");
    const field = label.split("-")[1] || label;
    let freq = label.split("-")[0]?.toUpperCase()?.includes("HOURLY") ? "hourly-" : "";
    if (label.split("-")[0]?.toUpperCase()?.includes("DAILY")) {
      freq = "daily-";
    }
    if (field?.toUpperCase()?.includes("DAILY") || field?.toUpperCase()?.includes("HOURLY")) {
      freq = "";
    }
    link.download = identifier + "-" + freq + field + "-" + moment.utc(Date.now()).format("MMDDYY") + ".csv";
    const csvEle = JSONToCSVConvertor(data, label + "-csv", label);
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
    const byteString = atob(dataURI.split(",")[1]);
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const integerArray = new Uint8Array(arrayBuffer);

    for (let i = 0; i < byteString.length; i++) {
      integerArray[i] = byteString.charCodeAt(i);
    }
    return new Blob([arrayBuffer], { type: "image/jpeg" });
  } catch (err: any) {
    console.error(err.message);
    return;
  }
}

export function lineupChartDatapoints(compChart: any) {
  try {
    const key1 = Object.keys(compChart)[0];
    const key2 = Object.keys(compChart)[1];

    let arr1 = compChart[key1].sort((a: any, b: any) => a.date - b.date);
    let arr2 = compChart[key2].sort((a: any, b: any) => a.date - b.date);

    const arr1StartDate = arr1[0]?.date;
    const arr2StartDate = arr2[0]?.date;

    if (!arr1StartDate) {
      throw new Error(
        `lineupChartDatapoints() error: compChart input key ${key1} was not an array holding objects with valid date properties holding timestamp values.`,
      );
    }
    if (!arr2StartDate) {
      throw new Error(
        `lineupChartDatapoints() error: compChart input key ${key2} was not an array holding objects with valid date properties holding timestamp values.`,
      );
    }

    if (arr1StartDate > arr2StartDate) {
      const arr2Index = arr2.findIndex((x: any) => x.date >= arr1StartDate - 86400);
      arr2 = arr2.slice(arr2Index);
    } else if (arr1StartDate < arr2StartDate) {
      const arr1Index = arr1.findIndex((x: any) => x.date >= arr2StartDate - 86400);
      arr1 = arr1.slice(arr1Index);
    }

    const matchedStartDatesCompChart = { [key1]: arr1, [key2]: arr2 };
    return matchedStartDatesCompChart;
  } catch (err: any) {
    console.error(err.message);
    return err;
  }
}

export function upperCaseFirstOfString(str: string) {
  const arr = str.split("");
  arr[0] = arr[0].toUpperCase();
  return arr.join("");
}

/**
 * Enhances deployment health metrics by properly extracting data from the
 * deployment object. This ensures the health metrics like "Indexed %",
 * "Start Block", "Current Block", and "Chain Head" are correctly displayed.
 * @param deploymentData Deployment data from the Messari Status API
 * @returns Enhanced deployment data with formatted health metrics
 */
export function enhanceHealthMetrics(deploymentData: any) {
  if (!deploymentData || !deploymentData.services) {
    return deploymentData;
  }

  const hostedService = deploymentData.services["hosted-service"];
  const decentralizedNetwork = deploymentData.services["decentralized-network"];

  // Process hosted service health data
  if (hostedService) {
    // If health is null, create an empty array for compatibility
    if (hostedService.health === null) {
      hostedService.health = [];
      // Add a single mock health entry with default values
      hostedService.health.push({
        "start-block": 0,
        "latest-block": 0,
        "chain-head-block": 0,
        "entity-count": 0,
        synced: false,
        "indexed-percentage": 0,
        "has-been-enhanced": true,
      });
    } else if (Array.isArray(hostedService.health) && hostedService.health.length > 0) {
      for (let i = 0; i < hostedService.health.length; i++) {
        const healthData = hostedService.health[i];

        if (!healthData) {
          continue;
        }

        // Ensure these fields exist with default values if they don't
        // Convert to numbers where appropriate
        healthData["start-block"] = safeNumberConversion(healthData["start-block"], 0);
        healthData["latest-block"] = safeNumberConversion(healthData["latest-block"], 0);
        healthData["chain-head-block"] = safeNumberConversion(healthData["chain-head-block"], 0);
        healthData["entity-count"] = safeNumberConversion(healthData["entity-count"], 0);

        if (healthData["synced"] === undefined || healthData["synced"] === null) {
          healthData["synced"] = false;
        }

        // Calculate indexed percentage
        const startBlock = healthData["start-block"];
        const latestBlock = healthData["latest-block"];
        const chainHeadBlock = healthData["chain-head-block"];

        if (chainHeadBlock > startBlock) {
          const indexedPercentage = ((latestBlock - startBlock) / (chainHeadBlock - startBlock)) * 100;
          healthData["indexed-percentage"] = indexedPercentage > 99.5 ? 100 : indexedPercentage;
        } else {
          healthData["indexed-percentage"] = 0;
        }

        // Set a flag to indicate that this health data has been enhanced
        healthData["has-been-enhanced"] = true;
      }
    }
  }

  // Process decentralized network health data
  if (decentralizedNetwork) {
    // If health is null, create an empty array for compatibility
    if (decentralizedNetwork.health === null) {
      decentralizedNetwork.health = [];
      // Add a single mock health entry with default values
      decentralizedNetwork.health.push({
        "start-block": 0,
        "latest-block": 0,
        "chain-head-block": 0,
        "entity-count": 0,
        synced: false,
        "indexed-percentage": 0,
        "has-been-enhanced": true,
      });
    } else if (Array.isArray(decentralizedNetwork.health) && decentralizedNetwork.health.length > 0) {
      for (let i = 0; i < decentralizedNetwork.health.length; i++) {
        const healthData = decentralizedNetwork.health[i];

        if (!healthData) {
          continue;
        }

        // Ensure these fields exist with default values if they don't
        // Convert to numbers where appropriate
        healthData["start-block"] = safeNumberConversion(healthData["start-block"], 0);
        healthData["latest-block"] = safeNumberConversion(healthData["latest-block"], 0);
        healthData["chain-head-block"] = safeNumberConversion(healthData["chain-head-block"], 0);
        healthData["entity-count"] = safeNumberConversion(healthData["entity-count"], 0);

        if (healthData["synced"] === undefined || healthData["synced"] === null) {
          healthData["synced"] = false;
        }

        // Calculate indexed percentage
        const startBlock = healthData["start-block"];
        const latestBlock = healthData["latest-block"];
        const chainHeadBlock = healthData["chain-head-block"];

        if (chainHeadBlock > startBlock) {
          const indexedPercentage = ((latestBlock - startBlock) / (chainHeadBlock - startBlock)) * 100;
          healthData["indexed-percentage"] = indexedPercentage > 99.5 ? 100 : indexedPercentage;
        } else {
          healthData["indexed-percentage"] = 0;
        }

        // Set a flag to indicate that this health data has been enhanced
        healthData["has-been-enhanced"] = true;
      }
    }
  }

  return deploymentData;
}

/**
 * Safely converts a value to a number
 * @param value Value to convert
 * @param defaultValue Default value if conversion fails
 * @returns Number value
 */
function safeNumberConversion(value: any, defaultValue: number): number {
  if (value === undefined || value === null) {
    return defaultValue;
  }

  if (typeof value === "number") {
    return value;
  }

  const parsed = Number(value);
  return !isNaN(parsed) ? parsed : defaultValue;
}

/**
 * Processes raw deployment data to ensure all deployments have the necessary health metrics structure.
 * Similar to what the prepare-deployment-data.js script does, but performed at runtime.
 * @param deploymentData Raw deployment data from GitHub
 * @returns Processed deployment data with proper health metrics structure
 */
export function processDeploymentData(deploymentData: Record<string, any>): Record<string, any> {
  // Create a deep copy to avoid modifying the original data
  const processedData = JSON.parse(JSON.stringify(deploymentData));

  // Process each protocol
  Object.keys(processedData).forEach((protocolName) => {
    const protocol = processedData[protocolName];

    if (protocol.deployments) {
      Object.keys(protocol.deployments).forEach((deploymentKey) => {
        const deployment = protocol.deployments[deploymentKey];

        // Ensure services object exists
        if (!deployment.services) {
          deployment.services = {};
        }

        // Ensure hosted-service exists if needed
        if (!deployment.services["hosted-service"]) {
          deployment.services["hosted-service"] = {
            slug: deploymentKey,
            "query-id": deploymentKey,
            health: null, // Will be enhanced by enhanceHealthMetrics
          };
        } else if (deployment.services["hosted-service"] && !deployment.services["hosted-service"].health) {
          deployment.services["hosted-service"].health = null;
        }

        // Ensure decentralized-network exists if needed
        if (!deployment.services["decentralized-network"]) {
          deployment.services["decentralized-network"] = {
            slug: deploymentKey,
            "query-id": "todo",
            health: null, // Will be enhanced by enhanceHealthMetrics
          };
        } else if (
          deployment.services["decentralized-network"] &&
          !deployment.services["decentralized-network"].health
        ) {
          deployment.services["decentralized-network"].health = null;
        }

        // Apply the enhanceHealthMetrics function to add health metrics
        protocol.deployments[deploymentKey] = enhanceHealthMetrics(deployment);
      });
    }
  });

  return processedData;
}
