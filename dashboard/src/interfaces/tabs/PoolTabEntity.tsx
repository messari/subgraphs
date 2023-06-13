import { Box, CircularProgress, Grid, Tooltip, Typography } from "@mui/material";
import {
  negativeFieldList,
  PoolName,
  PoolNames,
  dateValueKeys,
  nonStrictlyIncrementalFieldList,
} from "../../constants";
import { base64toBlobJPEG, convertTokenDecimals, downloadCSV, toDate } from "../../utils";
import { StackedChart } from "../../common/chartComponents/StackedChart";
import { useEffect, useState } from "react";
import { CopyLinkToClipboard } from "../../common/utilComponents/CopyLinkToClipboard";
import { ChartContainer } from "../../common/chartComponents/ChartContainer";
import moment from "moment";
import JSZip from "jszip";
import { UploadFileCSV } from "../../common/utilComponents/UploadFileCSV";

function addDataPoint(
  dataFields: { [dataField: string]: { date: Number; value: number }[] },
  dataFieldMetrics: any,
  fieldName: string,
  value: number,
  timestamp: number,
  id: string,
): { [x: string]: any } {
  dataFields[fieldName].push({ value: value, date: Number(timestamp) });
  if (!!dataFieldMetrics[fieldName]) {
    if (!dataFieldMetrics[fieldName]?.sum) {
      dataFieldMetrics[fieldName].sum = 0;
    }
    dataFieldMetrics[fieldName].sum += value;

    if (fieldName?.toUpperCase()?.includes("CUMULATIVE")) {
      if (!Object.keys(dataFieldMetrics[fieldName]).includes("cumulative")) {
        dataFieldMetrics[fieldName].cumulative = { prevVal: 0, hasLowered: "" };
      }
      if (value < dataFieldMetrics[fieldName].cumulative.prevVal) {
        dataFieldMetrics[fieldName].cumulative.hasLowered = id;
      }
      dataFieldMetrics[fieldName].cumulative.prevVal = value;
    }
    if (fieldName?.toUpperCase()?.includes("CUMULATIVE")) {
      if (!Object.keys(dataFieldMetrics[fieldName]).includes("cumulative")) {
        dataFieldMetrics[fieldName].cumulative = { prevVal: 0, hasLowered: "" };
      }
      if (Number(value) < dataFieldMetrics[fieldName].cumulative.prevVal) {
        dataFieldMetrics[fieldName].cumulative.hasLowered = id;
      }
      dataFieldMetrics[fieldName].cumulative.prevVal = Number(value);
    }
  }
  return {
    currentEntityField: dataFields[fieldName],
    currentEntityFieldMetrics: dataFieldMetrics[fieldName],
  };
}

interface PoolTabEntityProps {
  data: any;
  overlayData: any;
  currentEntityData: any[];
  entityName: string;
  entitiesData: { [x: string]: { [x: string]: string } };
  entitySpecificElements: any;
  overlayPoolTimeseriesData: any;
  overlayPoolTimeseriesLoading: boolean;
  poolId: string;
  protocolData: { [x: string]: any };
  setIssues: any;
}

function PoolTabEntity({
  data,
  overlayData,
  currentEntityData,
  entityName,
  entitiesData,
  entitySpecificElements,
  overlayPoolTimeseriesData,
  overlayPoolTimeseriesLoading,
  poolId,
  protocolData,
  setIssues,
}: PoolTabEntityProps) {
  const issues: { message: string; type: string; level: string; fieldName: string }[] = [];
  const [issuesSet, setIssuesSet] = useState<boolean>(false);

  // Get the key name of the pool specific to the protocol type (singular and plural)
  const poolKeySingular = PoolName[data.protocols[0].type];
  const poolKeyPlural = PoolNames[data.protocols[0].type];

  const excludedEntities = ["financialsDailySnapshots", "usageMetricsDailySnapshots", "usageMetricsHourlySnapshots"];
  const list: { [x: string]: any } = {};
  const [downloadAllCharts, triggerDownloadAllCharts] = useState<boolean>(false);
  const [chartsImageFiles, setChartsImageFiles] = useState<any>({});
  const [csvJSON, setCsvJSON] = useState<any>(null);
  const [csvMetaData, setCsvMetaData] = useState<any>({ fileName: "", columnName: "", csvError: null });

  // dataFields object has corresponding key:value pairs. Key is the field name and value is an array with an object holding the coordinates to be plotted on the chart for that entity field.
  const [dataFieldsState, setDataFieldsState] = useState<{
    [data: string]: { [dataField: string]: { date: number; value: number }[] };
  }>({});
  // dataFieldMetrics is used to store sums, expressions, etc calculated upon certain certain datafields to check for irregularities in the data
  const [dataFieldMetricsState, setDataFieldMetricsState] = useState<{
    [dataField: string]: { [metric: string]: any };
  }>({});
  // For the current entity, loop through all instances of that entity
  const [overlayDataFieldsState, setOverlayDataFieldsState] = useState<{
    [dataField: string]: { date: number; value: number }[];
  }>({});

  useEffect(() => {
    if (downloadAllCharts) {
      if (chartsImageFiles) {
        if (Object.keys(chartsImageFiles).length > 0) {
          let zip = new JSZip();
          Object.keys(chartsImageFiles).forEach((fileName) => {
            const blob = base64toBlobJPEG(chartsImageFiles[fileName]);
            if (blob) {
              zip.file(fileName + ".jpeg", blob);
            }
          });
          zip.generateAsync({ type: "base64" }).then(function (content) {
            const link = document.createElement("a");
            link.download = "charts.zip";
            link.href = "data:application/zip;base64," + content;
            link.click();
            triggerDownloadAllCharts(false);
          });
        }
      }
    }
  }, [chartsImageFiles]);

  useEffect(() => {
    if (!!downloadAllCharts) {
      triggerDownloadAllCharts(false);
    }
  }, [downloadAllCharts]);

  useEffect(() => {
    if (!issuesSet && issues.length > 0) {
      setIssues(issues);
      setIssuesSet(true);
    }
  });

  try {
    if (!poolId) {
      return null;
    }
    if (excludedEntities.includes(entityName)) {
      return null;
    }

    // currentEntityData holds the data on this entity
    if (currentEntityData.length === 0) {
      issues.push({ fieldName: entityName, type: "EMPTY", level: "critical", message: "" });
      return (
        <Box key={entityName}>
          <Typography variant="h4">ENTITY: {entityName}</Typography>
          <Typography variant="body1">{entityName} HAS NO TIMESERIES DATA.</Typography>
        </Box>
      );
    }

    let dataFields: { [dataField: string]: { date: number; value: number }[] } = {};
    // dataFieldMetrics is used to store sums, expressions, etc calculated upon certain certain datafields to check for irregularities in the data
    let dataFieldMetrics: { [dataField: string]: { [metric: string]: any } } = {};

    let overlayDataFields: { [dataField: string]: { date: number; value: number }[] } = {};

    if (!dataFieldsState?.data) {
      for (let x = currentEntityData.length - 1; x >= 0; x--) {
        const timeseriesInstance: { [x: string]: any } = currentEntityData[x];
        let dateVal: number = Number(timeseriesInstance["timestamp"]);
        dateValueKeys.forEach((key: string) => {
          let factor = 86400;
          if (key.includes("hour")) {
            factor = factor / 24;
          }
          if (!!(Number(timeseriesInstance[key]) * factor)) {
            dateVal = Number(timeseriesInstance[key]) * factor;
          }
        });

        const overlayDifference = currentEntityData.length - overlayPoolTimeseriesData.length;
        const overlayTimeseriesInstance: { [x: string]: any } = overlayPoolTimeseriesData[x - overlayDifference];
        let overlayDateVal: number = Number(overlayTimeseriesInstance?.["timestamp"]) || 0;
        if (!!overlayTimeseriesInstance) {
          dateValueKeys.forEach((key: string) => {
            let factor = 86400;
            if (key.includes("hour")) {
              factor = factor / 24;
            }
            if (!!(Number(overlayTimeseriesInstance[key]) * factor)) {
              overlayDateVal = Number(overlayTimeseriesInstance[key]) * factor;
            }
          });
        }
        // Take the given timeseries instance and loop thru the fields of the instance (ie totalValueLockedUSD)
        let skip = false;
        for (let z = 0; z < Object.keys(timeseriesInstance).length; z++) {
          const fieldName = Object.keys(timeseriesInstance)[z];
          if (
            fieldName === "timestamp" ||
            fieldName === "__typename" ||
            fieldName === "id" ||
            dateValueKeys.includes(fieldName)
          ) {
            continue;
          }
          const capsFieldName = fieldName.toUpperCase();
          const currentInstanceField = timeseriesInstance[fieldName];
          let currentOverlayInstanceField: any = null;
          if (overlayTimeseriesInstance) {
            if (Object.keys(overlayTimeseriesInstance).includes(fieldName)) {
              currentOverlayInstanceField = overlayTimeseriesInstance[fieldName];
            }
          }
          let value: any = currentInstanceField;
          try {
            if (!value && value !== 0 && !Array.isArray(currentInstanceField)) {
              value = 0;
              if (!dataFields[fieldName]) {
                dataFields[fieldName] = [];
                dataFieldMetrics[fieldName] = { sum: null };
              }
              if (capsFieldName === "REWARDTOKENEMISSIONSUSD") {
                if (!dataFields.rewardAPR) {
                  dataFields.rewardAPR = [];
                  dataFieldMetrics.rewardAPR = { sum: 0 };
                }
                dataFields.rewardAPR.push(value);
              }
              const returnedData = addDataPoint(
                dataFields,
                dataFieldMetrics,
                fieldName,
                Number(value),
                dateVal,
                timeseriesInstance.id,
              );
              dataFields[fieldName] = returnedData.currentEntityField;
              dataFieldMetrics[fieldName] = returnedData.currentEntityFieldMetrics;
              if (overlayTimeseriesInstance) {
                skip = true;
              } else {
                continue;
              }
            }
            if (!isNaN(currentInstanceField) && !Array.isArray(currentInstanceField) && currentInstanceField && !skip) {
              // Add the data to the array held on the dataField key of the fieldName
              if (!dataFields[fieldName]) {
                dataFields[fieldName] = [];
                dataFieldMetrics[fieldName] = { sum: 0 };
              }

              value = currentInstanceField;
              if (value < 0) {
                if (!dataFieldMetrics[fieldName].negative) {
                  // Capture the first snapshot (if there are multiple) where a value was negative. Count is cumulative
                  dataFieldMetrics[fieldName].negative = {
                    firstSnapshot: timeseriesInstance.id,
                    value: value,
                    count: 0,
                  };
                }
                dataFieldMetrics[fieldName].negative.count += 1;
              }
              if (
                (capsFieldName.includes("OUTPUTTOKEN") &&
                  capsFieldName !== "OUTPUTTOKEN" &&
                  !capsFieldName.includes("USD")) ||
                capsFieldName === "PRICEPERSHARE"
              ) {
                value = convertTokenDecimals(currentInstanceField, data[poolKeySingular]?.outputToken?.decimals);
              }
              if (
                [
                  "inputTokenBalance",
                  "mintSupply",
                  "dailyNativeDeposit",
                  "dailyNativeBorrow",
                  "dailyNativeLiquidate",
                  "dailyNativeWithdraw",
                  "dailyNativeRepay",
                  "dailyNativeTransfer",
                  "dailyNativeFlashloan",
                ].includes(fieldName)
              ) {
                const dec = data[poolKeySingular].inputToken.decimals;
                value = convertTokenDecimals(currentInstanceField, dec);
              }

              const returnedData = addDataPoint(
                dataFields,
                dataFieldMetrics,
                fieldName,
                Number(value),
                dateVal,
                timeseriesInstance.id,
              );
              dataFields[fieldName] = returnedData.currentEntityField;
              dataFieldMetrics[fieldName] = returnedData.currentEntityFieldMetrics;
            }

            if (fieldName.toUpperCase().includes("REWARDTOKEN") && !currentInstanceField && !skip) {
              // Catch the fields for reward token data that is optional but would be handled as an array
              let dataFieldKey = "";
              let iterateArray = data[poolKeySingular][fieldName];
              if (!Array.isArray(iterateArray)) {
                iterateArray = data[poolKeySingular]?.rewardTokens;
              }
              iterateArray.forEach((item: any, idx: number) => {
                const token = data[poolKeySingular]?.rewardTokens[idx];
                if (token?.token?.name) {
                  dataFieldKey = " [" + token?.token?.name + "]";
                } else {
                  dataFieldKey = " [" + idx + "]";
                }
                if (!dataFields[fieldName + dataFieldKey]) {
                  dataFields[fieldName + dataFieldKey] = [{ value: 0, date: dateVal }];
                  dataFieldMetrics[fieldName + dataFieldKey] = { sum: 0 };
                } else {
                  dataFields[fieldName + dataFieldKey].push({
                    value: 0,
                    date: dateVal,
                  });
                  dataFieldMetrics[fieldName + dataFieldKey].sum += 0;
                }
                if (fieldName === "rewardTokenEmissionsUSD") {
                  if (!dataFields["rewardAPR" + dataFieldKey]) {
                    dataFields["rewardAPR" + dataFieldKey] = [{ value: 0, date: dateVal }];
                    dataFieldMetrics["rewardAPR" + dataFieldKey] = { sum: 0 };
                  } else {
                    dataFields["rewardAPR" + dataFieldKey].push({
                      value: 0,
                      date: dateVal,
                    });
                    dataFieldMetrics["rewardAPR" + dataFieldKey].sum += 0;
                  }
                }
              });
              if (overlayTimeseriesInstance) {
                skip = true;
              } else {
                continue;
              }
            } else if (Array.isArray(currentInstanceField) && !skip) {
              // If the instance field data is an array, extrapolate this array into multiple keys (one for each element of the array)
              currentInstanceField.forEach((val: any, arrayIndex: number) => {
                // Determine the name/label/id of each element to be separated out of the array
                let fieldSplitIdentifier = arrayIndex.toString();
                let value: number = 0;
                if (!isNaN(Number(val))) {
                  value = Number(val);
                } else if (typeof val === "object") {
                  const holdingValueKey = Object.keys(val).find((x) => {
                    return !isNaN(Number(val[x]));
                  });
                  if (holdingValueKey) {
                    value = Number(val[holdingValueKey]);
                  }
                  if (val["type"]) {
                    fieldSplitIdentifier = val["type"];
                  } else {
                    const holdingValueStr = Object.keys(val).find((x) => {
                      return typeof val[x] === "string" && isNaN(Number(val[x]));
                    });
                    if (holdingValueStr) {
                      fieldSplitIdentifier = holdingValueStr;
                    }
                  }
                }

                if (fieldName === "rates") {
                  fieldSplitIdentifier = val.side + "-" + val.type;
                }
                const dataFieldKey = fieldName + " [" + fieldSplitIdentifier + "]";

                // Save the data to the dataFields object array
                if (!dataFields[dataFieldKey]) {
                  dataFields[dataFieldKey] = [];
                  dataFieldMetrics[dataFieldKey] = { sum: 0 };
                }

                if (val < 0) {
                  if (!dataFieldMetrics[dataFieldKey].negative) {
                    // Capture the first snapshot (if there are multiple) where a value was negative. Count is cumulative
                    dataFieldMetrics[dataFieldKey].negative = {
                      firstSnapshot: timeseriesInstance.id,
                      value: val,
                      count: 0,
                    };
                  }
                  dataFieldMetrics[dataFieldKey].negative.count += 1;
                }

                if (value || value === 0) {
                  if (
                    fieldName === "inputTokenBalances" ||
                    capsFieldName.includes("VOLUMEBYTOKENAMOUNT") ||
                    capsFieldName.includes("SUPPLYSIDETOKENAMOUNTS") ||
                    capsFieldName.includes("VOLUMETOKENAMOUNTS")
                  ) {
                    // convert the value with decimals for certain fields
                    value = convertTokenDecimals(val, data[poolKeySingular]?.inputTokens[arrayIndex]?.decimals);
                  }

                  if (fieldName === "rewardTokenEmissionsAmount") {
                    // If the current field is rewardTokenEmissionsAmount, convert the value with decimals
                    // Conditionals set up to get the decimals depending on how reward tokens are structured on the schema version
                    const currentRewardToken = data[poolKeySingular].rewardTokens[arrayIndex];
                    if (currentRewardToken?.token?.decimals || currentRewardToken?.token?.decimals === 0) {
                      value = convertTokenDecimals(val, currentRewardToken?.token?.decimals);
                    } else {
                      value = convertTokenDecimals(val, 18);
                    }
                  }

                  if (fieldName === "rewardTokenEmissionsUSD") {
                    //Convert emissions amount in USD to APR
                    const currentRewardToken = data[poolKeySingular].rewardTokens[arrayIndex];
                    const factors = ["rewardTokenEmissionsUSD"];
                    let apr = 0;
                    if (
                      currentRewardToken?.type?.includes("BORROW") &&
                      data.protocols[0]?.type === "LENDING" &&
                      timeseriesInstance?.totalBorrowBalanceUSD
                    ) {
                      apr = (Number(val) / timeseriesInstance.totalBorrowBalanceUSD) * 100 * 365;
                      factors.push("snapshot.totalBorrowBalanceUSD");
                    } else if (currentRewardToken?.type?.includes("BORROW")) {
                      issues.push({
                        type: "BORROW",
                        message:
                          "Attempted to calculate APR of BORROW reward token. Field 'totalBorrowBalanceUSD' is not present in the timeseries instance.",
                        level: "critical",
                        fieldName: entityName + "-" + fieldName,
                      });
                    } else if (timeseriesInstance?.totalDepositBalanceUSD && data.protocols[0].type === "LENDING") {
                      factors.push("snapshot.totalDepositBalanceUSD");
                      apr = (Number(val) / timeseriesInstance.totalDepositBalanceUSD) * 100 * 365;
                    } else {
                      if (
                        !Number(timeseriesInstance?.stakedOutputTokenAmount) ||
                        !Number(timeseriesInstance?.outputTokenSupply)
                      ) {
                        factors.push("snapshot.totalValueLockedUSD");
                        apr = (Number(val) / Number(timeseriesInstance.totalValueLockedUSD)) * 100 * 365;
                      } else {
                        factors.push(
                          "snapshot.totalValueLockedUSD",
                          "snapshot.stakedOutputTokenAmount",
                          "snapshot.outputTokenSupply",
                        );
                        apr =
                          (Number(val) /
                            (Number(timeseriesInstance.totalValueLockedUSD) *
                              (Number(timeseriesInstance?.stakedOutputTokenAmount) /
                                Number(timeseriesInstance?.outputTokenSupply)))) *
                          100 *
                          365;
                      }
                    }

                    if (!apr || !isFinite(apr)) {
                      apr = 0;
                    }
                    // Create the reward APR [idx] field
                    if (!dataFields["rewardAPR [" + fieldSplitIdentifier + "]"]) {
                      dataFields["rewardAPR [" + fieldSplitIdentifier + "]"] = [{ value: apr, date: dateVal }];
                      dataFieldMetrics["rewardAPR [" + fieldSplitIdentifier + "]"] = {
                        sum: apr,
                        factors: factors.join(", "),
                      };
                    } else {
                      dataFields["rewardAPR [" + fieldSplitIdentifier + "]"].push({
                        value: apr,
                        date: dateVal,
                      });
                      dataFieldMetrics["rewardAPR [" + fieldSplitIdentifier + "]"].sum += apr;
                    }
                  }
                } else {
                  value = 0;
                }
                const returnedData = addDataPoint(
                  dataFields,
                  dataFieldMetrics,
                  dataFieldKey,
                  Number(value),
                  dateVal,
                  timeseriesInstance.id,
                );
                dataFields[dataFieldKey] = returnedData.currentEntityField;
                dataFieldMetrics[dataFieldKey] = returnedData.currentEntityFieldMetrics;
              });
            }
          } catch (err) {
            let message = "JAVASCRIPT ERROR";
            if (err instanceof Error) {
              message = err.message;
            }
            console.log(err);
            issues.push({
              type: "JS",
              message: message,
              level: "critical",
              fieldName: entityName + "-" + fieldName,
            });
          }
          if (x < overlayDifference && overlayPoolTimeseriesData.length > 0) {
            overlayDataFields[fieldName] = [...overlayDataFields[fieldName], { value: 0, date: dateVal }];
            continue;
          }
          if (!overlayTimeseriesInstance) {
            continue;
          }
          value = currentOverlayInstanceField;
          try {
            if (!value && value !== 0 && !Array.isArray(currentOverlayInstanceField)) {
              value = 0;
              if (!overlayDataFields[fieldName]) {
                overlayDataFields[fieldName] = [];
              }
              if (capsFieldName === "REWARDTOKENEMISSIONSUSD") {
                if (!overlayDataFields.rewardAPR) {
                  overlayDataFields.rewardAPR = [];
                }
                overlayDataFields.rewardAPR.push(value);
              }
              const returnedData = addDataPoint(
                overlayDataFields,
                dataFieldMetrics,
                fieldName,
                Number(value),
                overlayDateVal,
                overlayTimeseriesInstance.id,
              );
              overlayDataFields[fieldName] = returnedData.currentEntityField;
              continue;
            }
            if (
              !isNaN(currentOverlayInstanceField) &&
              !Array.isArray(currentOverlayInstanceField) &&
              currentOverlayInstanceField
            ) {
              // Add the data to the array held on the dataField key of the fieldName
              if (!overlayDataFields[fieldName]) {
                overlayDataFields[fieldName] = [];
              }

              value = currentOverlayInstanceField;
              if (
                (capsFieldName.includes("OUTPUTTOKEN") &&
                  capsFieldName !== "OUTPUTTOKEN" &&
                  !capsFieldName.includes("USD")) ||
                capsFieldName === "PRICEPERSHARE"
              ) {
                value = convertTokenDecimals(currentOverlayInstanceField, data[poolKeySingular]?.outputToken?.decimals);
              }
              if (
                [
                  "inputTokenBalance",
                  "mintSupply",
                  "dailyNativeDeposit",
                  "dailyNativeBorrow",
                  "dailyNativeLiquidate",
                  "dailyNativeWithdraw",
                  "dailyNativeRepay",
                  "dailyNativeTransfer",
                  "dailyNativeFlashloan",
                ].includes(fieldName)
              ) {
                const dec = overlayData[poolKeySingular].inputToken.decimals;
                value = convertTokenDecimals(currentOverlayInstanceField, dec);
              }

              const returnedData = addDataPoint(
                overlayDataFields,
                dataFieldMetrics,
                fieldName,
                Number(value),
                overlayDateVal,
                overlayTimeseriesInstance.id,
              );
              overlayDataFields[fieldName] = returnedData.currentEntityField;
            }

            if (fieldName.toUpperCase().includes("REWARDTOKEN") && !currentOverlayInstanceField) {
              // Catch the fields for reward token overlayData that is optional but would be handled as an array
              let dataFieldKey = "";
              let iterateArray = overlayData[poolKeySingular][fieldName];
              if (!Array.isArray(iterateArray)) {
                iterateArray = overlayData[poolKeySingular]?.rewardTokens;
              }
              iterateArray.forEach((item: any, idx: number) => {
                const token = overlayData[poolKeySingular]?.rewardTokens[idx];
                if (token?.token?.name) {
                  dataFieldKey = " [" + token?.token?.name + "]";
                } else {
                  dataFieldKey = " [" + idx + "]";
                }
                if (!overlayDataFields[fieldName + dataFieldKey]) {
                  overlayDataFields[fieldName + dataFieldKey] = [{ value: 0, date: overlayDateVal }];
                } else {
                  overlayDataFields[fieldName + dataFieldKey].push({
                    value: 0,
                    date: overlayDateVal,
                  });
                }
                if (fieldName === "rewardTokenEmissionsUSD") {
                  if (!overlayDataFields["rewardAPR" + dataFieldKey]) {
                    overlayDataFields["rewardAPR" + dataFieldKey] = [{ value: 0, date: overlayDateVal }];
                  } else {
                    overlayDataFields["rewardAPR" + dataFieldKey].push({
                      value: 0,
                      date: overlayDateVal,
                    });
                  }
                }
              });
              continue;
            } else if (Array.isArray(currentOverlayInstanceField) && overlayData) {
              // If the instance field overlayData is an array, extrapolate this array into multiple keys (one for each element of the array)
              currentOverlayInstanceField.forEach((val: any, arrayIndex: number) => {
                // Determine the name/label/id of each element to be separated out of the array
                let fieldSplitIdentifier = arrayIndex.toString();
                let value: number = 0;
                if (!isNaN(Number(val))) {
                  value = Number(val);
                } else if (typeof val === "object") {
                  const holdingValueKey = Object.keys(val).find((x) => {
                    return !isNaN(Number(val[x]));
                  });
                  if (holdingValueKey) {
                    value = Number(val[holdingValueKey]);
                  }
                  if (val["type"]) {
                    fieldSplitIdentifier = val["type"];
                  } else {
                    const holdingValueStr = Object.keys(val).find((x) => {
                      return typeof val[x] === "string" && isNaN(Number(val[x]));
                    });
                    if (holdingValueStr) {
                      fieldSplitIdentifier = holdingValueStr;
                    }
                  }
                }

                if (fieldName === "rates") {
                  fieldSplitIdentifier = val.side + "-" + val.type;
                }
                const dataFieldKey = fieldName + " [" + fieldSplitIdentifier + "]";

                // Save the overlayData to the overlayDataFields object array
                if (!overlayDataFields[dataFieldKey]) {
                  overlayDataFields[dataFieldKey] = [];
                }

                if (value || value === 0) {
                  if (
                    fieldName === "inputTokenBalances" ||
                    capsFieldName.includes("VOLUMEBYTOKENAMOUNT") ||
                    capsFieldName.includes("SUPPLYSIDETOKENAMOUNTS") ||
                    capsFieldName.includes("VOLUMETOKENAMOUNTS")
                  ) {
                    // convert the value with decimals for certain fields
                    value = convertTokenDecimals(val, overlayData[poolKeySingular]?.inputTokens[arrayIndex]?.decimals);
                  }

                  if (fieldName === "rewardTokenEmissionsAmount") {
                    // If the current field is rewardTokenEmissionsAmount, convert the value with decimals
                    // Conditionals set up to get the decimals depending on how reward tokens are structured on the schema version
                    const currentRewardToken = overlayData[poolKeySingular].rewardTokens[arrayIndex];
                    if (currentRewardToken?.token?.decimals || currentRewardToken?.token?.decimals === 0) {
                      value = convertTokenDecimals(val, currentRewardToken?.token?.decimals);
                    } else {
                      value = convertTokenDecimals(val, 18);
                    }
                  }

                  if (fieldName === "rewardTokenEmissionsUSD") {
                    //Convert emissions amount in USD to APR
                    const currentRewardToken = overlayData[poolKeySingular].rewardTokens[arrayIndex];
                    const factors = ["rewardTokenEmissionsUSD"];
                    let apr = 0;
                    if (
                      currentRewardToken?.type?.includes("BORROW") &&
                      overlayData.protocols[0]?.type === "LENDING" &&
                      overlayTimeseriesInstance?.totalBorrowBalanceUSD
                    ) {
                      apr = (Number(val) / overlayTimeseriesInstance.totalBorrowBalanceUSD) * 100 * 365;
                      factors.push("snapshot.totalBorrowBalanceUSD");
                    } else if (currentRewardToken?.type?.includes("BORROW")) {
                      issues.push({
                        type: "BORROW",
                        message:
                          "Attempted to calculate APR of BORROW reward token. Field 'totalBorrowBalanceUSD' is not present in the timeseries instance.",
                        level: "critical",
                        fieldName: entityName + "-" + fieldName,
                      });
                    } else if (
                      overlayTimeseriesInstance?.totalDepositBalanceUSD &&
                      overlayData.protocols[0].type === "LENDING"
                    ) {
                      factors.push("snapshot.totalDepositBalanceUSD");
                      apr = (Number(val) / overlayTimeseriesInstance.totalDepositBalanceUSD) * 100 * 365;
                    } else {
                      if (
                        !Number(overlayTimeseriesInstance?.stakedOutputTokenAmount) ||
                        !Number(overlayTimeseriesInstance?.outputTokenSupply)
                      ) {
                        factors.push("snapshot.totalValueLockedUSD");
                        apr = (Number(val) / Number(overlayTimeseriesInstance.totalValueLockedUSD)) * 100 * 365;
                      } else {
                        factors.push(
                          "snapshot.totalValueLockedUSD",
                          "snapshot.stakedOutputTokenAmount",
                          "snapshot.outputTokenSupply",
                        );
                        apr =
                          (Number(val) /
                            (Number(overlayTimeseriesInstance.totalValueLockedUSD) *
                              (Number(overlayTimeseriesInstance?.stakedOutputTokenAmount) /
                                Number(overlayTimeseriesInstance?.outputTokenSupply)))) *
                          100 *
                          365;
                      }
                    }

                    if (!apr || !isFinite(apr)) {
                      apr = 0;
                    }
                    // Create the reward APR [idx] field
                    if (!overlayDataFields["rewardAPR [" + fieldSplitIdentifier + "]"]) {
                      overlayDataFields["rewardAPR [" + fieldSplitIdentifier + "]"] = [
                        { value: apr, date: overlayDateVal },
                      ];
                    } else {
                      overlayDataFields["rewardAPR [" + fieldSplitIdentifier + "]"].push({
                        value: apr,
                        date: overlayDateVal,
                      });
                    }
                  }
                } else {
                  value = 0;
                }
                const returnedData = addDataPoint(
                  overlayDataFields,
                  dataFieldMetrics,
                  dataFieldKey,
                  Number(value),
                  overlayDateVal,
                  overlayTimeseriesInstance.id,
                );
                overlayDataFields[dataFieldKey] = returnedData.currentEntityField;
              });
            }
          } catch (err) {
            let message = "JAVASCRIPT ERROR";
            if (err instanceof Error) {
              message = err.message;
            }
            console.log(err);
            issues.push({
              type: "JS",
              message: message,
              level: "critical",
              fieldName: entityName + "-" + fieldName,
            });
          }
        }
      }
      setDataFieldsState({ data: dataFields });
      setDataFieldMetricsState(dataFieldMetrics);
      setOverlayDataFieldsState(overlayDataFields);

      return <CircularProgress size={50} />;
    }

    dataFields = dataFieldsState.data;
    dataFieldMetrics = dataFieldMetricsState;
    overlayDataFields = overlayDataFieldsState;

    list[entityName] = {};
    // Code to determine what fields were expected/what were present
    for (let x = 0; x < Object.keys(entitiesData[entityName]).length; x++) {
      const entityField = Object.keys(entitiesData[entityName])[x];
      if (entityField === "timestamp") {
        continue;
      }
      const renderedField = dataFields[entityField];
      if (renderedField) {
        list[entityName][entityField] = "Included";
      } else {
        const extrapolatedFields = Object.keys(dataFields).filter((df: string) => {
          return df.includes(entityField);
        });
        if (extrapolatedFields?.length > 0) {
          list[entityName][entityField] = "Array Included";
        } else {
          const poolFieldChars = entitiesData[entityName][entityField].split("");
          const req = "!" === poolFieldChars[poolFieldChars.length - 1];
          if (req) {
            list[entityName][entityField] = "MISSING AND REQUIRED";
          } else {
            list[entityName][entityField] = "NOT REQUIRED";
          }
        }
      }
    }

    const fieldsList = Object.keys(dataFields);

    const rewardChart: { [x: string]: any } = {};
    Object.keys(dataFields).forEach((field: string) => {
      // Push the Reward APR fields to the bottom of the charts section
      if (field.toUpperCase().includes("REWARDAPR") && dataFields[field].length > 0) {
        if (
          (field.toUpperCase() === "REWARDAPR" &&
            Object.keys(dataFields).filter((x) => x.toUpperCase().includes("REWARDAPR")).length === 1) ||
          (field.toUpperCase() !== "REWARDAPR" &&
            Object.keys(dataFields).filter((x) => x.toUpperCase().includes("REWARDAPR")).length > 0)
        ) {
          rewardChart[field] = dataFields[field];
          delete dataFields[field];
        }
      }
      if (field.toUpperCase().includes("RATES")) {
        delete dataFields[field];
      }
    });

    // The rewardAPRElement logic is used to take all of the rewardAPR and display their lines on one graph
    let rewardAPRElement = null;
    if (Object.keys(rewardChart).length > 0 && !dataFieldMetrics["rewardAPR"]?.invalidDataPlot) {
      const elementId = entityName + "-rewardAPR";
      const tableVals: { value: any; date: any }[] = [];
      const amountOfInstances = rewardChart[Object.keys(rewardChart)[0]].length;
      for (let x = 0; x < amountOfInstances; x++) {
        let date: number | null = null;
        Object.keys(rewardChart).forEach((z) => {
          if (rewardChart[z][x]?.date && !date && x < rewardChart[z].length) {
            date = rewardChart[z][x].date;
          }
        });
        if (!date) {
          continue;
        }
        const valArr: string[] = [];
        Object.keys(rewardChart).forEach((reward: any, idx: number) => {
          if (!(fieldsList.filter((x) => x.includes(reward))?.length > 1)) {
            if (dataFieldMetrics[reward].sum === 0) {
              const fieldName = entityName + "-" + reward;
              issues.push({ type: "SUM", level: "error", fieldName, message: dataFieldMetrics[reward]?.factors });
            }
            const currentRewardToken: { [x: string]: string } = data[poolKeySingular]?.rewardTokens[idx]?.token;
            const symbol = currentRewardToken?.symbol ? currentRewardToken?.symbol + " " : "";
            let elementVal = rewardChart[reward][x];
            if (rewardChart[reward][x]?.value || rewardChart[reward][x]?.value === 0) {
              elementVal = rewardChart[reward][x].value;
            }
            if (!elementVal) {
              elementVal = 0;
            }
            elementVal = elementVal?.toFixed(2);
            valArr.push(`${symbol}[${idx}]: ${elementVal}%`);
          }
        });
        tableVals.push({ value: valArr.join(", "), date });
      }
      Object.keys(rewardChart).forEach((reward: any, idx: number) => {
        const currentRewardToken: { [x: string]: string } = data[poolKeySingular].rewardTokens[idx]?.token;
        const name = currentRewardToken?.name ? currentRewardToken?.name : "N/A";
        const val = rewardChart[reward];
        rewardChart[`${name} [${idx}]`] = val;
        delete rewardChart[reward];
      });
      if (tableVals.length === 0) {
        rewardAPRElement = null;
      } else {
        rewardAPRElement = (
          <ChartContainer
            csvMetaDataProp={csvMetaData}
            csvJSONProp={csvJSON}
            baseKey=""
            elementId={elementId}
            downloadAllCharts={downloadAllCharts}
            identifier={protocolData[Object.keys(protocolData)[0]]?.slug + "-" + data[poolKeySingular]?.id}
            datasetLabel="rewardAPR"
            dataChart={rewardChart}
            dataTable={tableVals}
            chartsImageFiles={chartsImageFiles}
            setChartsImageFiles={(x: any) => setChartsImageFiles(x)}
            isStringField={true}
          />
        );
      }
    }

    // The ratesElement logic is used to take all of the rates and display their lines on one graph
    let ratesElement = null;
    if (entitySpecificElements["rates"]) {
      ratesElement = (
        <ChartContainer
          csvMetaDataProp={csvMetaData}
          csvJSONProp={csvJSON}
          baseKey=""
          elementId={"rates"}
          downloadAllCharts={downloadAllCharts}
          identifier={protocolData[Object.keys(protocolData)[0]]?.slug + "-" + data[poolKeySingular]?.id}
          datasetLabel="RATES"
          dataTable={entitySpecificElements["rates"]["tableData"]}
          dataChart={entitySpecificElements["rates"]["dataChart"]}
          chartsImageFiles={chartsImageFiles}
          setChartsImageFiles={(x: any) => setChartsImageFiles(x)}
          isStringField={true}
        />
      );
      entitySpecificElements["rates"]?.["issues"]?.forEach((iss: any) => {
        issues.push({ type: "SUM", level: "error", fieldName: iss, message: "" });
      });
    }

    let tokenWeightComponent = null;
    if (entitySpecificElements["inputTokenWeights"]) {
      entitySpecificElements["inputTokenWeights"][0].forEach((val: any, idx: number) => {
        // Looping through all instances of inputToken 0
        let totalWeightAtIdx = val?.value;
        for (let i = 1; i < entitySpecificElements["inputTokenWeights"]?.length; i++) {
          totalWeightAtIdx += entitySpecificElements["inputTokenWeights"][i][idx]?.value;
        }
        if (totalWeightAtIdx > 50) {
          // If weights are greater than 50, its assumed that the value is denominated out of 100 rather than 1
          totalWeightAtIdx = totalWeightAtIdx / 100;
        }
        if (Math.abs(1 - totalWeightAtIdx) > 0.01) {
          const fieldName = entityName + "-inputTokenWeights";
          const date = toDate(val.date);
          issues.push({
            type: "VAL",
            level: "error",
            fieldName,
            message:
              entityName +
              "-inputTokenWeights on " +
              date +
              " add up to " +
              totalWeightAtIdx +
              "%, which is more than 1% off of 100%. The inputTokenWeights across all tokens should add up to 100% at any given point.",
          });
        }
      });
      const tokenWeightFieldName = "inputTokenWeights";
      tokenWeightComponent = (
        <div key={entityName + "-" + tokenWeightFieldName} id={entityName + "-" + tokenWeightFieldName}>
          <Box mt={3} mb={1}>
            <CopyLinkToClipboard link={window.location.href} scrollId={entityName + "-" + tokenWeightFieldName}>
              <Typography variant="h6">{entityName + "-" + tokenWeightFieldName}</Typography>
            </CopyLinkToClipboard>
          </Box>
          <Grid container>
            <StackedChart
              tokens={data[poolKeySingular].inputTokens}
              tokenWeightsArray={entitySpecificElements["inputTokenWeights"]}
              poolTitle={entityName + "-" + tokenWeightFieldName}
            />
          </Grid>
        </div>
      );
      delete entitySpecificElements["inputTokenWeights"];
    }

    const rewardTokensLength = data[poolKeySingular]?.rewardTokens?.length;
    const inputTokensLength = data[poolKeySingular]?.inputTokens?.length;

    const rewardFieldCount: { [x: string]: any } = {};
    const inputTokenFieldCount: { [x: string]: any } = {};
    Object.keys(dataFields).forEach((field) => {
      const fieldName = field.split(" [")[0];
      if (fieldName.includes("rewardToken")) {
        if (!rewardFieldCount[fieldName]) {
          rewardFieldCount[fieldName] = 0;
        }

        if (
          dataFields[field]?.length > 0 &&
          !(
            fieldName.toUpperCase() === field.toUpperCase() &&
            fieldsList.filter((x) => x.includes(fieldName))?.length > 1
          )
        ) {
          rewardFieldCount[fieldName] += 1;
        }
      } else if (fieldName.toUpperCase().includes("TOKEN") && !fieldName.toUpperCase().includes("OUTPUT")) {
        if (!inputTokenFieldCount[fieldName]) {
          inputTokenFieldCount[fieldName] = 0;
        }
        inputTokenFieldCount[fieldName] += 1;
      }
    });

    Object.keys(rewardFieldCount).forEach((field) => {
      if (rewardFieldCount[field] === 1 && data[poolKeySingular][field]) {
        if (data[poolKeySingular][field].length > rewardTokensLength) {
          issues.push({
            type: "TOK",
            level: "error",
            fieldName: `${data[poolKeySingular]?.name}-${field}///${data[poolKeySingular][field].length - 1}`,
            message: `rewardTokens///${rewardTokensLength - 1}`,
          });
        } else if (data[poolKeySingular][field].length < rewardTokensLength) {
          issues.push({
            type: "TOK",
            level: "error",
            fieldName: `${data[poolKeySingular]?.name}-rewardTokens///${rewardTokensLength - 1}`,
            message: `${field}///${data[poolKeySingular][field].length - 1}`,
          });
        }
      } else {
        if (rewardFieldCount[field] > rewardTokensLength) {
          if (!(rewardFieldCount[field] === 1 && dataFieldMetrics[field].sum === 0)) {
            issues.push({
              type: "TOK",
              level: "error",
              fieldName: `${data[poolKeySingular]?.name}-${field}///${rewardFieldCount[field] - 1}`,
              message: `rewardTokens///${rewardTokensLength - 1}`,
            });
          }
        } else if (rewardFieldCount[field] < rewardTokensLength) {
          issues.push({
            type: "TOK",
            level: "error",
            fieldName: `${data[poolKeySingular]?.name}-rewardTokens///${rewardTokensLength - 1}`,
            message: `${field}///${rewardFieldCount[field] - 1}`,
          });
        }
      }
    });

    Object.keys(inputTokenFieldCount).forEach((field) => {
      if (inputTokenFieldCount[field] > inputTokensLength) {
        issues.push({
          type: "TOK",
          level: "error",
          fieldName: `${data[poolKeySingular]?.name}-${field}///${inputTokenFieldCount[field] - 1}`,
          message: `inputTokens///${inputTokensLength - 1}`,
        });
      } else if (inputTokenFieldCount[field] < inputTokensLength) {
        issues.push({
          type: "TOK",
          level: "error",
          fieldName: `${data[poolKeySingular]?.name}-inputTokens///${inputTokensLength - 1}`,
          message: `${field}///${inputTokenFieldCount[field] - 1}`,
        });
      }
    });

    const mappedCurrentEntityData = currentEntityData
      .map((instance: any, idx: number) => {
        let instanceToSave: any = {};
        let dateVal: number = Number(instance["timestamp"]);
        dateValueKeys.forEach((key: string) => {
          let factor = 86400;
          if (key.includes("hour")) {
            factor = factor / 24;
          }
          if (!!(Number(instance[key]) * factor)) {
            dateVal = Number(instance[key]) * factor;
          }
        });
        instanceToSave.date = moment.utc(dateVal).format("YYYY-MM-DD");
        instanceToSave = { ...instanceToSave, ...instance };
        if (!!instance.rates) {
          instance.rates.forEach((rate: any, idx: number) => {
            instanceToSave["rate [" + idx + "]"] = rate.rate;
          });
          delete instanceToSave.rates;
        }

        Object.keys(entitySpecificElements).forEach((key: string) => {
          instanceToSave[key] = entitySpecificElements[key][entitySpecificElements[key]?.length - idx - 1]?.value || 0;
        });

        for (let tokenIdx = 0; tokenIdx < rewardTokensLength; tokenIdx++) {
          const amt = instance?.rewardTokenEmissionsAmount?.[tokenIdx] || 0;
          instanceToSave["rewardTokenEmissionsAmount [" + tokenIdx + "]"] = amt;
          const amtUSD = instance?.rewardTokenEmissionsUSD?.[tokenIdx] || 0;
          instanceToSave["rewardTokenEmissionsUSD [" + tokenIdx + "]"] = amtUSD;
          if (Object.keys(rewardChart).length > 0) {
            const amtAPR = rewardChart[Object.keys(rewardChart)?.[tokenIdx]]?.[idx]?.value || 0;
            instanceToSave["rewardAPR [" + tokenIdx + "]"] = amtAPR;
          }
        }

        for (let idx = 0; idx < inputTokensLength; idx++) {
          if (!!instance.inputTokenBalances) {
            const amt = instance?.inputTokenBalances?.[idx] || 0;
            instanceToSave["inputTokenBalances [" + idx + "]"] = amt;
          }
          if (!!instance.inputTokenWeights) {
            const amt = instance?.inputTokenWeights?.[idx] || 0;
            instanceToSave["inputTokenWeights [" + idx + "]"] = amt;
          }
          if (!!instance.dailyVolumeByTokenAmount) {
            const amt = instance?.dailyVolumeByTokenAmount?.[idx] || 0;
            instanceToSave["dailyVolumeByTokenAmount [" + idx + "]"] = amt;
          }
          if (!!instance.dailyVolumeByTokenUSD) {
            const amt = instance?.dailyVolumeByTokenUSD?.[idx] || 0;
            instanceToSave["dailyVolumeByTokenUSD [" + idx + "]"] = amt;
          }
          if (!!instance.hourlyVolumeByTokenAmount) {
            const amt = instance?.hourlyVolumeByTokenAmount?.[idx] || 0;
            instanceToSave["hourlyVolumeByTokenAmount [" + idx + "]"] = amt;
          }
          if (!!instance.hourlyVolumeByTokenUSD) {
            const amt = instance?.hourlyVolumeByTokenUSD?.[idx] || 0;
            instanceToSave["hourlyVolumeByTokenUSD [" + idx + "]"] = amt;
          }
        }

        delete instanceToSave.rewardTokenEmissionsAmount;
        delete instanceToSave.rewardTokenEmissionsUSD;
        delete instanceToSave.inputTokenBalances;
        delete instanceToSave.inputTokenWeights;
        delete instanceToSave.dailyVolumeByTokenAmount;
        delete instanceToSave.dailyVolumeByTokenUSD;
        delete instanceToSave.hourlyVolumeByTokenAmount;
        delete instanceToSave.hourlyVolumeByTokenUSD;
        delete instanceToSave.__typename;
        return instanceToSave;
      })
      .sort((a: any, b: any) => Number(a.timestamp) - Number(b.timestamp));

    Object.keys(entitySpecificElements).forEach((eleName: string) => {
      if (!Object.keys(entitySpecificElements[eleName])?.includes("dataChart") && !!entitySpecificElements[eleName]) {
        dataFields[eleName] = entitySpecificElements[eleName];
      }
    });

    const charts = Object.keys(dataFields).map((field: string) => {
      const fieldName = field.split(" [")[0];
      let label = entityName + "-" + field;
      // Label changes, element id is constant
      const elementId = label;
      const linkToElementId = elementId.split(" ").join("%20");

      try {
        const arrayIndex = Number(field?.split(" [")[1]?.split("]")[0]);
        // Generate the labeling for different token charts
        if (fieldName.toUpperCase().includes("INPUTTOKEN")) {
          if ((arrayIndex || arrayIndex === 0) && data[poolKeySingular]?.inputTokens) {
            const currentInputToken = data[poolKeySingular].inputTokens[arrayIndex];
            const name = currentInputToken?.name ? currentInputToken.name : "N/A";
            const symbol = currentInputToken?.symbol ? currentInputToken.symbol : "N/A";
            label += " - " + symbol + ": " + name;
          } else if (data[poolKeySingular]?.inputToken) {
            const name = data[poolKeySingular].inputToken?.name ? data[poolKeySingular].inputToken.name : "N/A";
            const symbol = data[poolKeySingular].inputToken?.symbol ? data[poolKeySingular].inputToken.symbol : "N/A";
            label += " - " + symbol + ": " + name;
          }
        } else if (fieldName.toUpperCase().includes("OUTPUTTOKEN")) {
          const name = data[poolKeySingular]?.outputToken?.name ? data[poolKeySingular]?.outputToken?.name : "N/A";
          const symbol = data[poolKeySingular]?.outputToken?.symbol
            ? data[poolKeySingular]?.outputToken?.symbol
            : "N/A";
          label += " - " + symbol + ": " + name;
        } else if (
          fieldName.toUpperCase().includes("TOKEN") &&
          data[poolKeySingular]?.inputToken &&
          !arrayIndex &&
          arrayIndex !== 0
        ) {
          const name = data[poolKeySingular]?.inputToken?.name ? data[poolKeySingular].inputToken.name : "N/A";
          const symbol = data[poolKeySingular]?.inputToken?.symbol ? data[poolKeySingular].inputToken.symbol : "N/A";
          label += " - " + symbol + ": " + name;
        }
        const isNegativeField = negativeFieldList.find((x: string) => {
          return field.toUpperCase().includes(x.toUpperCase());
        });
        if (dataFieldMetrics[field]?.negative && !isNegativeField) {
          issues.push({
            message: JSON.stringify(dataFieldMetrics[field]?.negative),
            type: "NEG",
            level: "critical",
            fieldName: `${entityName}-${field}`,
          });
        }
        if (dataFieldMetrics[field]?.invalidDataPlot) {
          return (
            <div key={elementId} id={linkToElementId}>
              <Box mt={3} mb={1}>
                <CopyLinkToClipboard link={window.location.href} scrollId={linkToElementId}>
                  <Typography variant="h6">{label}</Typography>
                </CopyLinkToClipboard>
              </Box>
              <Grid container>
                <Typography variant="body1" color="textSecondary">
                  {entityName}-{field} timeseries has invalid data. Cannot use{" "}
                  {dataFieldMetrics[field]?.invalidDataPlot} data types to plot chart. Evaluate how this data is
                  collected.
                </Typography>
              </Grid>
            </div>
          );
        }

        if (dataFieldMetrics[field]?.sum === 0 && !(fieldsList.filter((x) => x.includes(field))?.length > 1)) {
          // This array holds field names for fields that trigger a critical level issue rather than just an error level if all values are 0
          const criticalZeroFields = ["totalValueLockedUSD", "deposit"];
          let level = null;
          criticalZeroFields.forEach((criticalField) => {
            if (field.toUpperCase().includes(criticalField.toUpperCase())) {
              level = "critical";
            }
          });

          if (!level) {
            const schemaField = Object.keys(entitiesData[entityName]).find((fieldSchema: string) => {
              return field.includes(fieldSchema);
            });
            level = "warning";
            if (schemaField) {
              const fieldChars = entitiesData[entityName][schemaField].split("");
              if (fieldChars[fieldChars.length - 1] === "!") {
                level = "error";
              }
            }
          }
          issues.push({ type: "SUM", message: "", level, fieldName: label });
        }
        const isnonStrictlyIncrementalFieldList = nonStrictlyIncrementalFieldList.find((x: string) => {
          return field.toUpperCase().includes(x.toUpperCase());
        });
        if (!isnonStrictlyIncrementalFieldList && dataFieldMetrics[field]?.cumulative?.hasLowered?.length > 0) {
          issues.push({
            type: "CUMULATIVE",
            message: dataFieldMetrics[field]?.cumulative?.hasLowered,
            level: "error",
            fieldName: label,
          });
        }
      } catch (err) {
        let message = "JAVASCRIPT ERROR";
        if (err instanceof Error) {
          message = err.message;
        }
        console.log(err);
        issues.push({
          type: "JS",
          message: message,
          level: "critical",
          fieldName: entityName + "-" + field,
        });
        return (
          <div key={elementId}>
            <Box mt={3} mb={1}>
              <CopyLinkToClipboard link={window.location.href} scrollId={elementId}>
                <Typography variant="h6">
                  {field} - {message}
                </Typography>
              </CopyLinkToClipboard>
            </Box>
          </div>
        );
      }
      if (dataFields[fieldName]?.length === 0) {
        return null;
      }
      if (
        fieldName.toUpperCase() === field.toUpperCase() &&
        fieldsList.filter((x) => x.includes(fieldName))?.length > 1
      ) {
        return null;
      }

      if (fieldName.toUpperCase().includes("REWARD") && !(data[poolKeySingular]?.rewardTokens?.length > 0)) {
        return null;
      }
      if (fieldName.toUpperCase().includes("OUTPUT") && !data[poolKeySingular]?.outputToken) {
        return null;
      }
      let dataChartToPass: any = dataFields[field];
      let baseKey = `${data?.protocols[0]?.name}-${data?.protocols[0]?.network || ""}-${
        data?.protocols[0]?.subgraphVersion
      }-${field}`;
      if (overlayDataFields[field]?.length > 0) {
        const overlayKey = `${overlayData?.protocols[0]?.name || "overlay"}-${
          overlayData?.protocols[0]?.network || "network"
        }-${overlayData?.protocols[0]?.subgraphVersion || "v0.0.0"}`;
        let keyDiff = "";
        if (baseKey === overlayKey) {
          keyDiff = " (Overlay)";
        }
        dataChartToPass = { [baseKey]: dataFields[field], [overlayKey + keyDiff]: overlayDataFields[field] };
      }
      return (
        <ChartContainer
          csvMetaDataProp={csvMetaData}
          csvJSONProp={csvJSON}
          baseKey={baseKey}
          elementId={elementId}
          downloadAllCharts={downloadAllCharts}
          identifier={protocolData[Object.keys(protocolData)[0]]?.slug + "-" + data[poolKeySingular]?.id}
          datasetLabel={label}
          dataTable={dataFields[field]}
          dataChart={dataChartToPass}
          chartsImageFiles={chartsImageFiles}
          setChartsImageFiles={(x: any) => setChartsImageFiles(x)}
          isStringField={false}
        />
      );
    });

    return (
      <Grid key={entityName}>
        <Box sx={{ marginTop: "24px" }}>
          <CopyLinkToClipboard link={window.location.href} scrollId={entityName}>
            <Typography variant="h4">{entityName}</Typography>
          </CopyLinkToClipboard>
        </Box>
        <Tooltip placement="top" title={"Overlay chart with data points populated from a .csv file"}>
          <UploadFileCSV
            style={{ paddingLeft: "5px", color: "lime" }}
            isEntityLevel={true}
            csvMetaData={csvMetaData}
            field={entityName}
            csvJSON={csvJSON}
            setCsvJSON={setCsvJSON}
            setCsvMetaData={setCsvMetaData}
          />
        </Tooltip>
        <div>
          <div
            style={{ width: "25%", display: "block", paddingLeft: "5px", textAlign: "left", color: "white" }}
            className="Hover-Underline MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium MuiButtonBase-root  css-1huqmjz-MuiButtonBase-root-MuiButton-root"
            onClick={() => downloadCSV(mappedCurrentEntityData, entityName, entityName)}
          >
            Download Snapshots as csv
          </div>
          <div
            style={{ width: "25%", display: "block", paddingLeft: "5px", textAlign: "left", color: "white" }}
            className="Hover-Underline MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium MuiButtonBase-root  css-1huqmjz-MuiButtonBase-root-MuiButton-root"
            onClick={() => triggerDownloadAllCharts(true)}
          >
            Download All Charts
          </div>
        </div>
        {charts}
        {ratesElement}
        {rewardAPRElement}
        {tokenWeightComponent}
      </Grid>
    );
  } catch (err) {
    if (err instanceof Error) {
      console.log("CATCH,", Object.keys(err), Object.values(err), err);
      return <h3>JAVASCRIPT ERROR - POOL TAB - {err.message}</h3>;
    } else {
      return <h3>JAVASCRIPT ERROR - POOL TAB </h3>;
    }
  }
}

export default PoolTabEntity;
