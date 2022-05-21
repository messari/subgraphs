import { Box, Grid, Typography } from "@mui/material";
import { Chart } from "../../common/chartComponents/Chart";
import { TableChart } from "../../common/chartComponents/TableChart";
import { PoolDropDown } from "../../common/utilComponents/PoolDropDown";
import { PoolName, PoolNames } from "../../constants";
import SchemaTable from "../SchemaTable";
import { convertTokenDecimals } from "../../utils";
import { StackedChart } from "../../common/chartComponents/StackedChart";
import IssuesDisplay from "../IssuesDisplay";
import { useEffect, useState } from "react";
import { CopyLinkToClipboard } from "../../common/utilComponents/CopyLinkToClipboard";

function addDataPoint(
  dataFields: { [dataField: string]: { date: Number; value: number }[] },
  dataFieldMetrics: any,
  entityFieldName: string,
  value: number,
  timestamp: number,
): { [x: string]: any } {
  dataFields[entityFieldName].push({ value: value, date: Number(timestamp) });
  dataFieldMetrics[entityFieldName].sum += value;

  if (entityFieldName.includes("umulative")) {
    if (!Object.keys(dataFieldMetrics[entityFieldName]).includes("cumulative")) {
      dataFieldMetrics[entityFieldName].cumulative = { prevVal: 0, hasLowered: 0 };
    }
    if (value < dataFieldMetrics[entityFieldName].cumulative.prevVal) {
      dataFieldMetrics[entityFieldName].cumulative.hasLowered = Number(timestamp);
    }
    dataFieldMetrics[entityFieldName].cumulative.prevVal = value;
  }
  if (entityFieldName.includes("umulative")) {
    if (!Object.keys(dataFieldMetrics[entityFieldName]).includes("cumulative")) {
      dataFieldMetrics[entityFieldName].cumulative = { prevVal: 0, hasLowered: 0 };
    }
    if (Number(value) < dataFieldMetrics[entityFieldName].cumulative.prevVal) {
      dataFieldMetrics[entityFieldName].cumulative.hasLowered = Number(timestamp);
    }
    dataFieldMetrics[entityFieldName].cumulative.prevVal = Number(value);
  }
  return {
    currentEntityField: dataFields[entityFieldName],
    currentEntityFieldMetrics: dataFieldMetrics[entityFieldName],
  };
}

interface PoolTabProps {
  data: any;
  entities: string[];
  entitiesData: { [x: string]: { [x: string]: string } };
  poolId: string;
  setPoolId: React.Dispatch<React.SetStateAction<string>>;
  poolData: { [x: string]: string };
}

function PoolTab({ data, entities, entitiesData, poolId, setPoolId, poolData }: PoolTabProps) {
  const [issuesState, setIssues] = useState<{ message: string; type: string; level: string; fieldName: string }[]>([]);
  const issues: { message: string; type: string; level: string; fieldName: string }[] = issuesState;

  // Get the key name of the pool specific to the protocol type (singular and plural)
  const poolKeySingular = PoolName[data.protocols[0].type];
  const poolKeyPlural = PoolNames[data.protocols[0].type];

  const excludedEntities = ["financialsDailySnapshots", "usageMetricsDailySnapshots", "usageMetricsHourlySnapshots"];

  const list: { [x: string]: any } = {};

  const poolEntityElements = entities.map((entityName: string) => {
    try {
      // entityName is the type of entity being looped through
      if (!poolId) {
        return null;
      }
      if (excludedEntities.includes(entityName)) {
        return null;
      }

      // currentEntityData holds the data on this entity
      const currentEntityData = data[entityName];
      if (currentEntityData.length === 0) {
        return (
          <Box key={entityName}>
            <Typography variant="h4">ENTITY: {entityName}</Typography>
            <Typography variant="body1" style={{ color: "red" }}>
              {entityName} HAS NO INSTANCES.
            </Typography>
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
            // CURRENTLY THE FEE IS BASED OFF OF THE POOL RATHER THAN THE TIME SERIES. THIS IS TEMPORARY
            const supplierFee = data[poolKeySingular].fees.find((fee: { [x: string]: string }) => {
              return fee.feeType === "FIXED_LP_FEE" || fee.feeType === "DYNAMIC_LP_FEE";
            });
            let feePercentage = 0;
            if (supplierFee) {
              feePercentage = Number(supplierFee.feePercentage);
            }
            const volumeUSD = Number(timeseriesInstance.dailyVolumeUSD) || Number(timeseriesInstance.hourlyVolumeUSD);
            value = ((feePercentage * volumeUSD) / Number(timeseriesInstance.totalValueLockedUSD)) * 100;
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
          const entityFieldName = Object.keys(timeseriesInstance)[z];
          if (entityFieldName === "timestamp" || entityFieldName === "__typename") {
            continue;
          }
          const capsEntityFieldName = entityFieldName.toUpperCase();
          const currentInstanceField = timeseriesInstance[entityFieldName];
          let value: any = currentInstanceField;
          if (!value && value !== 0 && !Array.isArray(currentInstanceField)) {
            let dataType = "undefined";
            if (value === null) {
              dataType = "null";
            }
            if (isNaN(value)) {
              dataType = "NaN";
            }
            dataFields[entityFieldName] = [];
            dataFieldMetrics[entityFieldName] = { sum: 0, invalidData: dataType };
            if (capsEntityFieldName === "REWARDTOKENEMISSIONSUSD") {
              dataFields.rewardAPR = [];
              dataFieldMetrics.rewardAPR = { sum: 0, invalidData: dataType };
            }
            continue;
          }
          if (!isNaN(currentInstanceField) && !Array.isArray(currentInstanceField) && currentInstanceField) {
            value = Number(currentInstanceField);

            if (capsEntityFieldName.includes("OUTPUTTOKEN") && capsEntityFieldName !== "OUTPUTTOKEN") {
              value = convertTokenDecimals(currentInstanceField, data[poolKeySingular].outputToken.decimals);
            }
            if (entityFieldName === "inputTokenBalance" || entityFieldName === "pricePerShare") {
              const dec = data[poolKeySingular].inputToken.decimals;
              value = convertTokenDecimals(currentInstanceField, dec);
            }

            // Add the data to the array held on the dataField key of the entityFieldName
            if (!dataFields[entityFieldName]) {
              dataFields[entityFieldName] = [];
              dataFieldMetrics[entityFieldName] = { sum: 0 };
            }

            const returnedData = addDataPoint(
              dataFields,
              dataFieldMetrics,
              entityFieldName,
              Number(value),
              timeseriesInstance.timestamp,
            );
            dataFields[entityFieldName] = returnedData.currentEntityField;
            dataFieldMetrics[entityFieldName] = returnedData.currentEntityFieldMetrics;
          }

          if (entityFieldName.toUpperCase().includes("REWARDTOKEN") && !currentInstanceField) {
            // Catch the fields for reward token data that is optional but would be handled as an array
            let dataFieldKey = "";
            let iterateArray = data[poolKeySingular][entityFieldName];
            if (!Array.isArray(iterateArray)) {
              iterateArray = data[poolKeySingular]?.rewardTokens;
            }
            iterateArray.forEach((item: any, idx: number) => {
              const token = data[poolKeySingular]?.rewardTokens[idx];
              if (token?.token?.name) {
                dataFieldKey = " [" + token?.token?.name + "]";
              } else if (token?.name) {
                dataFieldKey = " [" + token?.name + "]";
              } else {
                dataFieldKey = " [" + idx + "]";
              }
              if (!dataFields[entityFieldName + dataFieldKey]) {
                dataFields[entityFieldName + dataFieldKey] = [{ value: 0, date: Number(timeseriesInstance.timestamp) }];
                dataFieldMetrics[entityFieldName + dataFieldKey] = { sum: 0 };
              } else {
                dataFields[entityFieldName + dataFieldKey].push({
                  value: 0,
                  date: Number(timeseriesInstance.timestamp),
                });
                dataFieldMetrics[entityFieldName + dataFieldKey].sum += 0;
              }
              if (entityFieldName === "rewardTokenEmissionsUSD") {
                if (!dataFields["rewardAPR" + dataFieldKey]) {
                  dataFields["rewardAPR" + dataFieldKey] = [{ value: 0, date: Number(timeseriesInstance.timestamp) }];
                  dataFieldMetrics["rewardAPR" + dataFieldKey] = { sum: 0 };
                } else {
                  dataFields["rewardAPR" + dataFieldKey].push({ value: 0, date: Number(timeseriesInstance.timestamp) });
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

              if (entityFieldName === "rates") {
                fieldSplitIdentifier = val.side + "-" + val.type;
              }

              const dataFieldKey = entityFieldName + " [" + fieldSplitIdentifier + "]";

              if (value || value === 0) {
                if (entityFieldName === "inputTokenBalances") {
                  // If the current field is inputTokenBalances, convert the value with decimals
                  value = convertTokenDecimals(val, data[poolKeySingular].inputTokens[arrayIndex].decimals);
                }

                if (entityFieldName === "rewardTokenEmissionsAmount") {
                  // If the current field is rewardTokenEmissionsAmount, convert the value with decimals
                  // Conditionals set up to get the decimals depending on how reward tokens are structured on the schema version

                  const currentRewardToken = data[poolKeySingular].rewardTokens[arrayIndex];
                  if (currentRewardToken?.decimals) {
                    value = convertTokenDecimals(val, currentRewardToken?.decimals);
                  } else if (currentRewardToken?.token?.decimals) {
                    value = convertTokenDecimals(val, currentRewardToken?.token?.decimals);
                  } else {
                    value = convertTokenDecimals(val, 18);
                    issues.push({
                      type: "DEC",
                      message: `${poolKeySingular}-${entityFieldName}-${arrayIndex}`,
                      level: "error",
                      fieldName: `${poolKeySingular}-${entityFieldName}`,
                    });
                  }
                }

                if (entityFieldName === "rewardTokenEmissionsUSD") {
                  //Convert emissions amount in USD to APY/APR
                  // total reward emission USD / total staked USD * 100 = reward APR
                  let apr = 0;
                  if (timeseriesInstance?.totalDepositBalanceUSD && poolKeySingular === "LENDING") {
                    apr = (Number(val) / timeseriesInstance.totalDepositBalanceUSD) * 100 * 365;
                  } else {
                    if (
                      !Number(timeseriesInstance?.stakedOutputTokenAmount) ||
                      !Number(timeseriesInstance?.outputTokenSupply)
                    ) {
                      apr = (Number(val) / Number(timeseriesInstance.totalValueLockedUSD)) * 100 * 365;
                    } else {
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
                    dataFieldMetrics["rewardAPR [" + fieldSplitIdentifier + "]"] = { sum: apr };
                  } else {
                    dataFields["rewardAPR [" + fieldSplitIdentifier + "]"].push({
                      value: apr,
                      date: Number(timeseriesInstance.timestamp),
                    });
                    dataFieldMetrics["rewardAPR [" + fieldSplitIdentifier + "]"].sum += apr;
                  }
                }

                // Save the data to the dataFields object array
                if (!dataFields[dataFieldKey]) {
                  dataFields[dataFieldKey] = [];
                  dataFieldMetrics[dataFieldKey] = { sum: 0 };
                }
                const returnedData = addDataPoint(
                  dataFields,
                  dataFieldMetrics,
                  dataFieldKey,
                  Number(value),
                  timeseriesInstance.timestamp,
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
                dataFieldMetrics[dataFieldKey] = { sum: 0, invalidData: dataType };
              }
            });
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
      if (Object.keys(rewardChart).length > 0) {
        const elementId = entityName + "-rewardAPR";
        const tableVals: { value: any; date: any }[] = [];
        const firstKey = Object.keys(rewardChart)[0];
        const amountOfInstances = rewardChart[Object.keys(rewardChart)[0]].length;
        for (let x = 0; x < amountOfInstances; x++) {
          tableVals.push({ value: [], date: rewardChart[firstKey][x].date });
          Object.keys(rewardChart).forEach((reward: any, idx: number) => {
            let currentRewardToken: { [x: string]: string } = {};
            if (data[poolKeySingular].rewardTokens[idx]?.token) {
              currentRewardToken = data[poolKeySingular].rewardTokens[idx].token;
            } else {
              currentRewardToken = data[poolKeySingular].rewardTokens[idx];
            }
            const name = currentRewardToken?.name ? currentRewardToken?.name : "N/A";
            tableVals[x].value.push(`${name} [${idx}]: ${rewardChart[reward][x].value.toFixed(3)}%`);
          });
          tableVals[x].value = tableVals[x].value.join(", ");
        }
        Object.keys(rewardChart).forEach((reward: any, idx: number) => {
          let currentRewardToken: { [x: string]: string } = {};
          if (data[poolKeySingular].rewardTokens[idx]?.token) {
            currentRewardToken = data[poolKeySingular].rewardTokens[idx].token;
          } else {
            currentRewardToken = data[poolKeySingular].rewardTokens[idx];
          }
          const name = currentRewardToken?.name ? currentRewardToken?.name : "N/A";
          const val = rewardChart[reward];
          rewardChart[`${name} [${idx}]`] = val;
          delete rewardChart[reward];
        });
        const table = (
          <Grid key={elementId + "Table"} item xs={4}>
            {TableChart("REWARD-APR", tableVals, currentEntityData.length)}
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
                {Chart("REWARD-APR", rewardChart, amountOfInstances)}
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
          tableVals[x].value = tableVals[x].value.join(", ");
        }
        Object.keys(ratesChart).forEach((rate: any, idx: number) => {
          if (data[poolKeySingular].rates[idx]?.side) {
            const val = ratesChart[rate];
            ratesChart[`${data[poolKeySingular].rates[idx]?.side}-${data[poolKeySingular].rates[idx]?.type} [${idx}]`] =
              val;
            delete ratesChart[rate];
          }
        });
        const table = (
          <Grid key={elementId + "Table"} item xs={4}>
            {TableChart("RATES", tableVals, currentEntityData.length)}
          </Grid>
        );
        ratesElement = (
          <div id={elementId}>
            <Box mt={3} mb={1}>
              <CopyLinkToClipboard link={window.location.href} scrollId={elementId}>
                <Typography variant="h6">{elementId}</Typography>
              </CopyLinkToClipboard>
            </Box>
            <Grid container justifyContent="space-between">
              <Grid key={elementId + "Chart"} item xs={7.5}>
                {Chart("RATES", ratesChart, amountOfInstances)}
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
            <div id={entityName + "-" + tokenWeightFieldName}>
              <Box mt={3} mb={1}>
                <CopyLinkToClipboard link={window.location.href} scrollId={entityName + "-" + tokenWeightFieldName}>
                  <Typography variant="h6">{entityName + "-" + tokenWeightFieldName}</Typography>
                </CopyLinkToClipboard>
              </Box>
              <Grid container>
                {StackedChart(data[poolKeySingular].inputTokens, currentTokenWeightArray, tokenWeightFieldName)}
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
            const arrayIndex = Number(field?.split(" [")[1]?.split("]")[0]);

            // Generate the labeling for different token charts
            if (fieldName.toUpperCase().includes("INPUTTOKEN")) {
              if ((arrayIndex || arrayIndex === 0) && data[poolKeySingular]?.inputTokens) {
                const currentInputToken = data[poolKeySingular].inputTokens[arrayIndex];
                const name = currentInputToken.name ? currentInputToken.name : "N/A";
                const symbol = currentInputToken.symbol ? currentInputToken.symbol : "N/A";
                label += " - " + symbol + ": " + name;
              } else if (data[poolKeySingular]?.inputToken) {
                const name = data[poolKeySingular].inputToken.name ? data[poolKeySingular].inputToken.name : "N/A";
                const symbol = data[poolKeySingular].inputToken.symbol
                  ? data[poolKeySingular].inputToken.symbol
                  : "N/A";
                label += " - " + symbol + ": " + name;
              }
            } else if (fieldName.toUpperCase().includes("OUTPUTTOKEN")) {
              const name = data[poolKeySingular].outputToken.name ? data[poolKeySingular].outputToken.name : "N/A";
              const symbol = data[poolKeySingular].outputToken.symbol
                ? data[poolKeySingular].outputToken.symbol
                : "N/A";
              label += " - " + symbol + ": " + name;
            } else if (
              fieldName.toUpperCase().includes("TOKEN") &&
              data[poolKeySingular]?.inputToken &&
              !arrayIndex &&
              arrayIndex !== 0
            ) {
              const name = data[poolKeySingular].inputToken.name ? data[poolKeySingular].inputToken.name : "N/A";
              const symbol = data[poolKeySingular].inputToken.symbol ? data[poolKeySingular].inputToken.symbol : "N/A";
              label += " - " + symbol + ": " + name;
            } else if (arrayIndex || arrayIndex === 0) {
              if (
                (fieldName.toUpperCase().includes("REWARDTOKEN") || fieldName.toUpperCase().includes("REWARDAPR")) &&
                data[poolKeySingular]?.rewardTokens
              ) {
                let currentRewardToken: { [x: string]: string } = {};
                if (data[poolKeySingular].rewardTokens[arrayIndex]?.token) {
                  currentRewardToken = data[poolKeySingular].rewardTokens[arrayIndex].token;
                } else {
                  currentRewardToken = data[poolKeySingular].rewardTokens[arrayIndex];
                }
                const name = currentRewardToken?.name ? currentRewardToken?.name : "N/A";
                const symbol = currentRewardToken?.symbol ? currentRewardToken?.symbol : "N/A";
                label += " - " + symbol + ": " + name;
              } else if (data[poolKeySingular]?.inputTokens) {
                const currentInputToken = data[poolKeySingular].inputTokens[arrayIndex];
                const name = currentInputToken.name ? currentInputToken.name : "N/A";
                const symbol = currentInputToken.symbol ? currentInputToken.symbol : "N/A";
                label += " - " + symbol + ": " + name;
              }
            }
            const elementId = entityName + "-" + field;
            const linkToElementId = elementId.split(" ").join("%20");
            if (dataFieldMetrics[field]?.invalidData) {
              return (
                <div id={linkToElementId}>
                  <Box mt={3} mb={1}>
                    <CopyLinkToClipboard link={window.location.href} scrollId={linkToElementId}>
                      <Typography variant="h6">{label}</Typography>
                    </CopyLinkToClipboard>
                  </Box>
                  <Grid container>
                    <Typography variant="body1" color="textSecondary">
                      {entityName}-{field} timeseries has invalid data. Cannot use{" "}
                      {dataFieldMetrics[field]?.invalidData} data types to plot chart. Evaluate how this data is
                      collected.
                    </Typography>
                  </Grid>
                </div>
              );
            }
            if (dataFieldMetrics[field].sum === 0 && issues.filter((x) => x.fieldName === label).length === 0) {
              // This array holds field names for fields that trigger a critical level issue rather than just an error level if all values are 0
              const criticalZeroFields = ["totalValueLockedUSD", "deposit", "balance", "supply"];
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
              dataFieldMetrics[field]?.cumulative?.hasLowered > 0
            ) {
              issues.push({
                type: "CUMULATIVE",
                message: `${label}++${dataFieldMetrics[field].cumulative.hasLowered}`,
                level: "error",
                fieldName: label,
              });
            }

            return (
              <div id={linkToElementId}>
                <Box mt={3} mb={1}>
                  <CopyLinkToClipboard link={window.location.href} scrollId={linkToElementId}>
                    <Typography variant="h6">{label}</Typography>
                  </CopyLinkToClipboard>
                </Box>
                <Grid container justifyContent="space-between">
                  <Grid key={elementId + "1"} item xs={7.5}>
                    {Chart(label, dataFields[field], currentEntityData.length)}
                  </Grid>
                  <Grid key={elementId + "2"} item xs={4}>
                    {TableChart(label, dataFields[field], currentEntityData.length)}
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
  });

  // PoolTVL warning check
  const poolLevelTVL = parseFloat(data[poolKeySingular]?.totalValueLockedUSD);
  if (issues.filter((x) => x.fieldName === poolKeySingular && x.type === "TVL-").length === 0 && poolLevelTVL < 1000) {
    issues.push({ type: "TVL-", message: "", level: "critical", fieldName: poolKeySingular });
  } else if (
    issues.filter((x) => x.fieldName === poolKeySingular && x.type === "TVL+").length === 0 &&
    poolLevelTVL > 1000000000000
  ) {
    issues.push({ type: "TVL+", message: "", level: "critical", fieldName: poolKeySingular });
  }

  useEffect(() => {
    console.log("POOL ISSUES TO SET", issues, issuesState);
    setIssues(issues);
  }, [issuesState]);

  const entityData = data[poolKeySingular];
  return (
    <div>
      <IssuesDisplay issuesArray={issuesState} />
      <PoolDropDown
        poolId={poolId}
        setPoolId={(x) => setPoolId(x)}
        setIssues={(x) => setIssues(x)}
        markets={data[poolKeyPlural]}
      />
      <SchemaTable
        entityData={entityData}
        schemaName={poolKeySingular}
        setIssues={(x) => setIssues(x)}
        dataFields={poolData}
        issuesProps={issuesState}
      />
      {poolEntityElements}
    </div>
  );
}

export default PoolTab;
