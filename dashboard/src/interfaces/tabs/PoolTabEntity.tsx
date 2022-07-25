import { Box, Grid, Typography } from "@mui/material";
import { Chart } from "../../common/chartComponents/Chart";
import { TableChart } from "../../common/chartComponents/TableChart";
import { negativeFieldList, PoolName, PoolNames } from "../../constants";
import { convertTokenDecimals } from "../../utils";
import { StackedChart } from "../../common/chartComponents/StackedChart";
import { useEffect } from "react";
import { CopyLinkToClipboard } from "../../common/utilComponents/CopyLinkToClipboard";

function addDataPoint(
  dataFields: { [dataField: string]: { date: Number; value: number }[] },
  dataFieldMetrics: any,
  fieldName: string,
  value: number,
  timestamp: number,
  id: string,
): { [x: string]: any } {
  dataFields[fieldName].push({ value: value, date: Number(timestamp) });
  dataFieldMetrics[fieldName].sum += value;

  if (fieldName.includes("umulative")) {
    if (!Object.keys(dataFieldMetrics[fieldName]).includes("cumulative")) {
      dataFieldMetrics[fieldName].cumulative = { prevVal: 0, hasLowered: "" };
    }
    if (value < dataFieldMetrics[fieldName].cumulative.prevVal) {
      dataFieldMetrics[fieldName].cumulative.hasLowered = id;
    }
    dataFieldMetrics[fieldName].cumulative.prevVal = value;
  }
  if (fieldName.includes("umulative")) {
    if (!Object.keys(dataFieldMetrics[fieldName]).includes("cumulative")) {
      dataFieldMetrics[fieldName].cumulative = { prevVal: 0, hasLowered: "" };
    }
    if (Number(value) < dataFieldMetrics[fieldName].cumulative.prevVal) {
      dataFieldMetrics[fieldName].cumulative.hasLowered = id;
    }
    dataFieldMetrics[fieldName].cumulative.prevVal = Number(value);
  }
  return {
    currentEntityField: dataFields[fieldName],
    currentEntityFieldMetrics: dataFieldMetrics[fieldName],
  };
}

interface PoolTabEntityProps {
  data: any;
  currentEntityData: any[];
  entityName: string;
  entitiesData: { [x: string]: { [x: string]: string } };
  poolId: string;
  protocolData: { [x: string]: any };
  setIssues: React.Dispatch<{ [x: string]: { message: string; type: string; level: string; fieldName: string }[] }>;
  issuesProps: { [x: string]: { message: string; type: string; level: string; fieldName: string }[] };
}

function PoolTabEntity({
  data,
  currentEntityData,
  entityName,
  entitiesData,
  poolId,
  protocolData,
  setIssues,
  issuesProps,
}: PoolTabEntityProps) {
  const issues: { message: string; type: string; level: string; fieldName: string }[] = [];
  // Get the key name of the pool specific to the protocol type (singular and plural)
  const poolKeySingular = PoolName[data.protocols[0].type];
  const poolKeyPlural = PoolNames[data.protocols[0].type];

  const excludedEntities = ["financialsDailySnapshots", "usageMetricsDailySnapshots", "usageMetricsHourlySnapshots"];

  const list: { [x: string]: any } = {};

  useEffect(() => {
    const issuesToSet = { ...issuesProps };
    issuesToSet[entityName] = issues;
    setIssues(issuesToSet);
  });

  try {
    // entityName is the type of entity being looped through
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
    const dataFields: { [dataField: string]: { date: number; value: number }[] } = {};
    // dataFieldMetrics is used to store sums, expressions, etc calculated upon certain certain datafields to check for irregularities in the data
    const dataFieldMetrics: { [dataField: string]: { [metric: string]: any } } = {};
    for (let x = currentEntityData.length - 1; x >= 0; x--) {
      const timeseriesInstance: { [x: string]: any } = currentEntityData[x];

      // For exchange protocols, calculate the baseYield
      if (data.protocols[0].type === "EXCHANGE") {
        let value = 0;
        if (Object.keys(data[poolKeySingular]?.fees)?.length > 0 && timeseriesInstance.totalValueLockedUSD) {
          const revenueUSD =
            Number(timeseriesInstance.dailySupplySideRevenueUSD) * 365 ||
            Number(timeseriesInstance.hourlySupplySideRevenueUSD) * 24 * 365;
          value = (revenueUSD / Number(timeseriesInstance.totalValueLockedUSD)) * 100;
          if (!value) {
            value = 0;
          }
        }
        if (!dataFields.baseYield) {
          dataFields.baseYield = [];
          dataFieldMetrics.baseYield = { sum: 0 };
        } else {
          dataFields.baseYield.push({ value, date: Number(timeseriesInstance.timestamp) });
          dataFieldMetrics.baseYield.sum += value;
        }
      }
      // Take the given timeseries instance and loop thru the fields of the instance (ie totalValueLockedUSD)
      for (let z = 0; z < Object.keys(timeseriesInstance).length; z++) {
        const fieldName = Object.keys(timeseriesInstance)[z];
        if (fieldName === "timestamp" || fieldName === "__typename" || fieldName === "id") {
          continue;
        }
        const capsFieldName = fieldName.toUpperCase();
        const currentInstanceField = timeseriesInstance[fieldName];
        let value: any = currentInstanceField;
        try {
          if (!value && value !== 0 && !Array.isArray(currentInstanceField)) {
            let dataType = "undefined";
            if (value === null) {
              dataType = "null";
            }
            if (isNaN(value)) {
              dataType = "NaN";
            }
            dataFields[fieldName] = [];
            dataFieldMetrics[fieldName] = { sum: 0, invalidDataPlot: dataType };
            if (
              capsFieldName.includes("REWARD") &&
              issues.filter((x) => x.type === "VAL" && x.fieldName.includes(fieldName)).length === 0
            ) {
              issues.push({
                type: "VAL",
                level: "critical",
                fieldName: fieldName,
                message: `${timeseriesInstance.__typename}-${fieldName} should be an array, but has a ${dataType} value in its timeseries data (first instance in ${timeseriesInstance.__typename} ${timeseriesInstance.id})`,
              });
            }
            if (capsFieldName === "REWARDTOKENEMISSIONSUSD") {
              dataFields.rewardAPR = [];
              dataFieldMetrics.rewardAPR = { sum: 0, invalidDataPlot: dataType };
            }
            continue;
          }
          if (!isNaN(currentInstanceField) && !Array.isArray(currentInstanceField) && currentInstanceField) {
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
            if (fieldName === "inputTokenBalance") {
              const dec = data[poolKeySingular].inputToken.decimals;
              value = convertTokenDecimals(currentInstanceField, dec);
            }

            const returnedData = addDataPoint(
              dataFields,
              dataFieldMetrics,
              fieldName,
              Number(value),
              timeseriesInstance.timestamp,
              timeseriesInstance.id,
            );
            dataFields[fieldName] = returnedData.currentEntityField;
            dataFieldMetrics[fieldName] = returnedData.currentEntityFieldMetrics;

            if (
              (capsFieldName === "HOURLYLIQUIDATEUSD" || capsFieldName === "DAILYLIQUIDATEUSD") &&
              Number(value) > Number(timeseriesInstance.totalValueLockedUSD) &&
              issues.filter((x) => x.fieldName === entityName + "-" + fieldName && x.type === "LIQ").length === 0
            ) {
              issues.push({
                type: "LIQ",
                message: timeseriesInstance.id,
                level: "critical",
                fieldName: entityName + "-" + fieldName,
              });
            }
          }

          if (fieldName.toUpperCase().includes("REWARDTOKEN") && !currentInstanceField) {
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
                dataFields[fieldName + dataFieldKey] = [{ value: 0, date: Number(timeseriesInstance.timestamp) }];
                dataFieldMetrics[fieldName + dataFieldKey] = { sum: 0 };
              } else {
                dataFields[fieldName + dataFieldKey].push({
                  value: 0,
                  date: Number(timeseriesInstance.timestamp),
                });
                dataFieldMetrics[fieldName + dataFieldKey].sum += 0;
              }
              if (fieldName === "rewardTokenEmissionsUSD") {
                if (!dataFields["rewardAPR" + dataFieldKey]) {
                  dataFields["rewardAPR" + dataFieldKey] = [{ value: 0, date: Number(timeseriesInstance.timestamp) }];
                  dataFieldMetrics["rewardAPR" + dataFieldKey] = { sum: 0 };
                } else {
                  dataFields["rewardAPR" + dataFieldKey].push({
                    value: 0,
                    date: Number(timeseriesInstance.timestamp),
                  });
                  dataFieldMetrics["rewardAPR" + dataFieldKey].sum += 0;
                }
              }
            });
            continue;
          } else if (Array.isArray(currentInstanceField)) {
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
                fieldSplitIdentifier = val.id.split("-0x")[0];
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
                if (fieldName === "inputTokenBalances" || capsFieldName.includes("VOLUMEBYTOKENAMOUNT")) {
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
                    currentRewardToken.type === "BORROW" &&
                    data.protocols[0].type === "LENDING" &&
                    timeseriesInstance?.totalBorrowBalanceUSD
                  ) {
                    apr = (Number(val) / timeseriesInstance.totalBorrowBalanceUSD) * 100 * 365;
                    factors.push("snapshot.totalBorrowBalanceUSD");
                  } else if (
                    currentRewardToken.type === "BORROW" &&
                    issues.filter((x) => x.fieldName === entityName + "-" + fieldName && x.type === "BORROW").length ===
                    0
                  ) {
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
                    dataFields["rewardAPR [" + fieldSplitIdentifier + "]"] = [
                      { value: apr, date: Number(timeseriesInstance.timestamp) },
                    ];
                    dataFieldMetrics["rewardAPR [" + fieldSplitIdentifier + "]"] = {
                      sum: apr,
                      factors: factors.join(", "),
                    };
                  } else {
                    dataFields["rewardAPR [" + fieldSplitIdentifier + "]"].push({
                      value: apr,
                      date: Number(timeseriesInstance.timestamp),
                    });
                    dataFieldMetrics["rewardAPR [" + fieldSplitIdentifier + "]"].sum += apr;
                  }
                }

                const returnedData = addDataPoint(
                  dataFields,
                  dataFieldMetrics,
                  dataFieldKey,
                  Number(value),
                  timeseriesInstance.timestamp,
                  timeseriesInstance.id,
                );
                dataFields[dataFieldKey] = returnedData.currentEntityField;
                dataFieldMetrics[dataFieldKey] = returnedData.currentEntityFieldMetrics;
              } else {
                let dataType = "undefined";
                if (value === null) {
                  dataType = "null";
                }
                if (isNaN(value)) {
                  dataType = "NaN";
                }
                dataFields[dataFieldKey] = [];
                dataFieldMetrics[dataFieldKey] = { sum: 0, invalidDataPlot: dataType };
              }
            });
          }
        } catch (err) {
          if (issues.filter((x) => x.fieldName === entityName + "-" + fieldName && x.type === "JS")?.length === 0) {
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
    }

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

    const ratesChart: { [x: string]: any } = {};
    const rewardChart: { [x: string]: any } = {};
    const tokenWeightData: { [name: string]: any[] } = {};
    Object.keys(dataFields).forEach((field: string) => {
      // consolidate tokenweight fields
      if (field.toUpperCase().includes("TOKENWEIGHTS")) {
        const fieldName = field.split(" [")[0];
        if (!tokenWeightData[fieldName]) {
          tokenWeightData[fieldName] = [];
        }
        tokenWeightData[fieldName].push(dataFields[field]);
        delete dataFields[field];
      }

      // Push the Reward APR fields to the bottom of the charts section
      if (field.toUpperCase().includes("REWARDAPR") && dataFields[field].length > 0) {
        rewardChart[field] = dataFields[field];
        delete dataFields[field];
      }

      // separate all of the rates fields to the ratesChart object
      if (field.toUpperCase().includes("RATES")) {
        ratesChart[field] = dataFields[field];
        delete dataFields[field];
      }
    });

    // The rewardAPRElement logic is used to take all of the rewardAPR and display their lines on one graph
    let rewardAPRElement = null;
    if (Object.keys(rewardChart).length > 0 && !dataFieldMetrics["rewardAPR"]?.invalidDataPlot) {
      const elementId = entityName + "-rewardAPR";
      const tableVals: { value: any; date: any }[] = [];
      const firstKey = Object.keys(rewardChart)[0];
      const amountOfInstances = rewardChart[Object.keys(rewardChart)[0]].length;
      for (let x = 0; x < amountOfInstances; x++) {
        tableVals.push({ value: [], date: rewardChart[firstKey][x].date });
        Object.keys(rewardChart).forEach((reward: any, idx: number) => {
          if (
            dataFieldMetrics[reward].sum === 0 &&
            issues.filter((x) => x.fieldName === entityName + "-" + reward).length === 0
          ) {
            const fieldName = entityName + "-" + reward;
            issues.push({ type: "SUM", level: "error", fieldName, message: dataFieldMetrics[reward]?.factors });
          }
          const currentRewardToken: { [x: string]: string } = data[poolKeySingular]?.rewardTokens[idx]?.token;
          const symbol = currentRewardToken?.symbol ? currentRewardToken?.symbol + " " : "";
          tableVals[x].value.push(`${symbol}[${idx}]: ${rewardChart[reward][x].value.toFixed(3)}`);
        });
      }
      Object.keys(rewardChart).forEach((reward: any, idx: number) => {
        const currentRewardToken: { [x: string]: string } = data[poolKeySingular].rewardTokens[idx].token;
        const name = currentRewardToken?.name ? currentRewardToken?.name : "N/A";
        const val = rewardChart[reward];
        rewardChart[`${name} [${idx}]`] = val;
        delete rewardChart[reward];
      });
      const table = (
        <Grid key={elementId + "Table"} item xs={4}>
          <TableChart datasetLabel="rewardAPR" dataTable={tableVals} />
        </Grid>
      );
      rewardAPRElement = (
        <div id={elementId}>
          <Box mt={3} mb={1}>
            <CopyLinkToClipboard link={window.location.href} scrollId={elementId}>
              <Typography variant="h6">{elementId}</Typography>
            </CopyLinkToClipboard>
          </Box>
          <Grid container justifyContent="space-between">
            <Grid key={elementId + "Chart"} item xs={7.5}>
              <Chart datasetLabel="rewardAPR" dataChart={rewardChart} />
            </Grid>
            {table}
          </Grid>
        </div>
      );
    }

    // The ratesElement logic is used to take all of the rates and display their lines on one graph
    let ratesElement = null;
    if (Object.keys(ratesChart).length > 0) {
      const elementId = entityName + "-rates";
      const tableVals: { value: any; date: any }[] = [];
      const firstKey = Object.keys(ratesChart)[0];
      const amountOfInstances = ratesChart[Object.keys(ratesChart)[0]].length;
      for (let x = 0; x < amountOfInstances; x++) {
        tableVals.push({ value: [], date: ratesChart[firstKey][x].date });
        Object.keys(ratesChart).forEach((rate: any, idx: number) => {
          tableVals[x].value.push(`[${idx}]: ${ratesChart[rate][x].value.toFixed(3)}`);
        });
      }
      Object.keys(ratesChart).forEach((rate: any, idx: number) => {
        if (
          dataFieldMetrics[rate].sum === 0 &&
          issues.filter((x) => x.fieldName === entityName + "-" + rate).length === 0
        ) {
          issues.push({ type: "SUM", level: "error", fieldName: entityName + "-" + rate, message: "" });
        }
        if (data[poolKeySingular].rates[idx]?.side) {
          const val = ratesChart[rate];
          ratesChart[`${data[poolKeySingular].rates[idx]?.id.split("-0x")[0]} [${idx}]`] = val;
          delete ratesChart[rate];
        }
      });
      const table = (
        <Grid key={elementId + "Table"} item xs={4}>
          <TableChart datasetLabel="RATES" dataTable={tableVals} />
        </Grid>
      );
      ratesElement = (
        <div key={elementId} id={elementId}>
          <Box mt={3} mb={1}>
            <CopyLinkToClipboard link={window.location.href} scrollId={elementId}>
              <Typography variant="h6">{elementId}</Typography>
            </CopyLinkToClipboard>
          </Box>
          <Grid container justifyContent="space-between">
            <Grid key={elementId + "Chart"} item xs={7.5}>
              <Chart datasetLabel="RATES" dataChart={ratesChart} />
            </Grid>
            {table}
          </Grid>
        </div>
      );
    }

    let tokenWeightComponent = null;
    if (Object.keys(tokenWeightData).length > 0) {
      tokenWeightComponent = Object.keys(tokenWeightData).map((tokenWeightFieldName) => {
        const currentTokenWeightArray = tokenWeightData[tokenWeightFieldName];
        return (
          <div key={entityName + "-" + tokenWeightFieldName} id={entityName + "-" + tokenWeightFieldName}>
            <Box mt={3} mb={1}>
              <CopyLinkToClipboard link={window.location.href} scrollId={entityName + "-" + tokenWeightFieldName}>
                <Typography variant="h6">{entityName + "-" + tokenWeightFieldName}</Typography>
              </CopyLinkToClipboard>
            </Box>
            <Grid container>
              <StackedChart
                tokens={data[poolKeySingular].inputTokens}
                tokenWeightsArray={currentTokenWeightArray}
                poolTitle={entityName + "-" + tokenWeightFieldName}
              />
            </Grid>
          </div>
        );
      });
    }

    // Move baseYield chart to bottom (above token weights)
    if (dataFields.baseYield) {
      const baseYield = dataFields.baseYield;
      delete dataFields.baseYield;
      dataFields.baseYield = baseYield;
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
        rewardFieldCount[fieldName] += 1;
      } else if (fieldName.toUpperCase().includes("TOKEN") && !fieldName.toUpperCase().includes("OUTPUT")) {
        if (!inputTokenFieldCount[fieldName]) {
          inputTokenFieldCount[fieldName] = 0;
        }
        inputTokenFieldCount[fieldName] += 1;
      }
    });

    Object.keys(rewardFieldCount).forEach((field) => {
      if (issues.filter((x) => x.type === "TOK" && x.fieldName.includes(data[poolKeySingular]?.name)).length === 0) {
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
            issues.push({
              type: "TOK",
              level: "error",
              fieldName: `${data[poolKeySingular]?.name}-${field}///${rewardFieldCount[field] - 1}`,
              message: `rewardTokens///${rewardTokensLength - 1}`,
            });
          } else if (rewardFieldCount[field] < rewardTokensLength) {
            issues.push({
              type: "TOK",
              level: "error",
              fieldName: `${data[poolKeySingular]?.name}-rewardTokens///${rewardTokensLength - 1}`,
              message: `${field}///${rewardFieldCount[field] - 1}`,
            });
          }
        }
      }
    });

    Object.keys(inputTokenFieldCount).forEach((field) => {
      if (issues.filter((x) => x.type === "TOK" && x.fieldName.includes(data[poolKeySingular]?.name)).length === 0) {
        if (inputTokenFieldCount[field] > inputTokensLength) {
          issues.push({
            type: "TOK",
            level: "error",
            fieldName: `${data[poolKeySingular]?.name}-${field}///${inputTokenFieldCount[field]}`,
            message: `inputTokens///${inputTokensLength - 1}`,
          });
        } else if (inputTokenFieldCount[field] < inputTokensLength) {
          issues.push({
            type: "TOK",
            level: "error",
            fieldName: `${data[poolKeySingular]?.name}-inputTokens///${inputTokensLength - 1}`,
            message: `${field}///${inputTokenFieldCount[field]}`,
          });
        }
      }
    });

    return (
      <Grid key={entityName}>
        <Box my={3}>
          <CopyLinkToClipboard link={window.location.href} scrollId={entityName}>
            <Typography variant="h4">{entityName}</Typography>
          </CopyLinkToClipboard>
        </Box>
        {Object.keys(dataFields).map((field: string) => {
          const fieldName = field.split(" [")[0];
          // const schemaFieldTypeString = entitiesData[entityName][fieldName].split("");
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
                const symbol = data[poolKeySingular].inputToken?.symbol
                  ? data[poolKeySingular].inputToken.symbol
                  : "N/A";
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
              const symbol = data[poolKeySingular]?.inputToken?.symbol
                ? data[poolKeySingular].inputToken.symbol
                : "N/A";
              label += " - " + symbol + ": " + name;
            }
            const isNegativeField = negativeFieldList.find((x: string) => {
              return field.toUpperCase().includes(x.toUpperCase());
            });
            if (
              dataFieldMetrics[field]?.negative &&
              !isNegativeField &&
              issues.filter((x) => x.fieldName === `${entityName}-${field}` && x.type === "NEG").length === 0
            ) {
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
            if (dataFieldMetrics[field].sum === 0 && issues.filter((x) => x.fieldName === label).length === 0) {
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
            if (
              issues.filter((x) => x.fieldName === label && x.type === "CUMULATIVE").length === 0 &&
              dataFieldMetrics[field]?.cumulative?.hasLowered?.length > 0
            ) {
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
            if (issues.filter((x) => x.fieldName === entityName + "-" + field && x.type === "JS")?.length === 0) {
              issues.push({
                type: "JS",
                message: message,
                level: "critical",
                fieldName: entityName + "-" + field,
              });
            }
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
          if (dataFieldMetrics[fieldName]?.invalidDataPlot || dataFieldMetrics[field]?.invalidDataPlot) {
            return null;
          }
          return (
            <div key={elementId} id={linkToElementId}>
              <Box mt={3} mb={1}>
                <CopyLinkToClipboard link={window.location.href} scrollId={linkToElementId}>
                  <Typography variant="h6">{label}</Typography>
                </CopyLinkToClipboard>
              </Box>
              <Grid container justifyContent="space-between">
                <Grid key={elementId + "1"} item xs={7.5}>
                  <Chart datasetLabel={label} dataChart={dataFields[field]} />
                </Grid>
                <Grid key={elementId + "2"} item xs={4}>
                  <TableChart datasetLabel={label} dataTable={dataFields[field]} />
                </Grid>
              </Grid>
            </div>
          );
        })}
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
