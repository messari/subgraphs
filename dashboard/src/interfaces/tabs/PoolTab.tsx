import { Grid, Paper, Table, TableBody, TableCell, TableContainer, TableRow } from "@mui/material";
import { Chart } from "../../common/chartComponents/Chart";
import { TableChart } from "../../common/chartComponents/TableChart";
import { PoolDropDown } from "../../common/utilComponents/PoolDropDown";
import { PoolName, PoolNames, Versions } from "../../constants";
import SchemaTable from "../SchemaTable";
import { convertTokenDecimals } from "../../utils/index";
import { StackedChart } from "../../common/chartComponents/StackedChart";
import ScrollToElement from "../../common/utilComponents/ScrollToElement";

interface PoolTabProps {
  data: any;
  entities: string[];
  entitiesData: { [x: string]: { [x: string]: string } };
  poolId: string;
  setPoolId: React.Dispatch<React.SetStateAction<string>>;
  poolData: { [x: string]: string };
  setWarning: React.Dispatch<React.SetStateAction<{ message: string; type: string }[]>>;
  issues: { message: string; type: string }[];
}

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

function PoolTab({ data, entities, entitiesData, poolId, setPoolId, poolData, setWarning, issues }: PoolTabProps) {
  try {
    // Get the key name of the pool specific to the protocol type (singular and plural)
    const poolKeySingular = PoolName[data.protocols[0].type];
    const poolKeyPlural = PoolNames[data.protocols[0].type];

    const excludedEntities = ["financialsDailySnapshots", "usageMetricsDailySnapshots", "usageMetricsHourlySnapshots"];

    const list: { [x: string]: any } = {};

    const poolEntityElements = entities.map((entityName: string) => {
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
          <Grid key={entityName} style={{ borderTop: "black 2px solid" }}>
            <h2>ENTITY: {entityName}</h2>
            <h3 style={{ color: "red" }}>{entityName} HAS NO INSTANCES.</h3>
          </Grid>
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
          if (!isNaN(currentInstanceField) && !Array.isArray(currentInstanceField) && currentInstanceField) {
            value = Number(currentInstanceField);

            if (capsEntityFieldName.includes("OUTPUTTOKEN") && capsEntityFieldName !== "OUTPUTTOKEN") {
              value = convertTokenDecimals(currentInstanceField, data[poolKeySingular].outputToken.decimals);
            }
            if (entityFieldName === "inputTokenBalance") {
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
            currentInstanceField.forEach((val: string, arrayIndex: number) => {
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

              const dataFieldKey = entityFieldName + " [" + fieldSplitIdentifier + "]";
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
                  issues.push({ type: "DEC", message: poolKeySingular + "-" + entityFieldName + "-" + arrayIndex });
                }
              }

              if (entityFieldName === "rewardTokenEmissionsUSD") {
                //Convert emissions amount in USD to APY/APR
                // total reward emission USD / total staked USD * 100 = reward APR
                let apr = 0;
                if (timeseriesInstance?.stakedOutputTokenAmount) {
                  apr =
                    (Number(val) /
                      (timeseriesInstance.outputTokenPriceUSD * timeseriesInstance.stakedOutputTokenAmount)) *
                    100 *
                    365;
                } else if (timeseriesInstance?.totalDepositBalanceUSD) {
                  apr = (Number(val) / timeseriesInstance.totalDepositBalanceUSD) * 100 * 365;
                } else {
                  apr = (Number(val) / timeseriesInstance.totalValueLockedUSD) * 100 * 365;
                }
                if (!apr) {
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
            const req =
              "!" ===
              entitiesData[entityName][entityField].split("")[
                entitiesData[entityName][entityField].split("").length - 1
              ];
            if (req) {
              list[entityName][entityField] = "MISSING AND REQUIRED";
            } else {
              list[entityName][entityField] = "NOT REQUIRED";
            }
          }
        }
      }

      console.log("LIST", list);

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
        if (field.toUpperCase().includes("REWARDAPR")) {
          const val = dataFields[field];
          delete dataFields[field];
          dataFields[field] = val;
        }
      });
      let tokenWeightComponent = null;
      if (Object.keys(tokenWeightData).length > 0) {
        tokenWeightComponent = Object.keys(tokenWeightData).map((tokenWeightFieldName) => {
          const currentTokenWeightArray = tokenWeightData[tokenWeightFieldName];
          return (
            <div
              id={entityName + "-" + tokenWeightFieldName}
              style={{ borderTop: "2px black solid", borderWidth: "80%" }}
            >
              <div style={{ marginLeft: "40px" }}>
                <ScrollToElement
                  label={entityName + "-" + tokenWeightFieldName}
                  elementId={entityName + "-" + tokenWeightFieldName}
                  poolId={poolId}
                  tab="pool"
                />
              </div>
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

      console.log("DATAFIELDSOBJ-POOL", dataFields);

      return (
        <Grid key={entityName} style={{ borderTop: "black 2px solid" }}>
          <Grid container>
            <h2 id={entityName}>ENTITY: {entityName}</h2>
            <div style={{ marginLeft: "40px" }}>
              <ScrollToElement label={entityName} elementId={entityName} poolId={poolId} tab="pool" />
            </div>
          </Grid>
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
            if (dataFieldMetrics[field].sum === 0 && issues.filter((x) => x.message === label).length === 0) {
              issues.push({ type: "SUM", message: label });
            }
            if (
              issues.filter((x) => x.message === label && x.type === "CUMULATIVE").length === 0 &&
              dataFieldMetrics[field]?.cumulative?.hasLowered > 0
            ) {
              issues.push({
                type: "CUMULATIVE",
                message: label + "++" + dataFieldMetrics[field].cumulative.hasLowered,
              });
            }

            const elementId = entityName + "-" + field.split(" ").join("%20");
            return (
              <div id={elementId} style={{ borderTop: "2px black solid", borderWidth: "80%" }}>
                <div style={{ marginLeft: "40px" }}>
                  <ScrollToElement label={label} elementId={elementId} poolId={poolId} tab="pool" />
                </div>
                <Grid container>
                  <Grid key={elementId + "1"} item xs={8}>
                    {Chart(label, dataFields[field], currentEntityData.length)}
                  </Grid>
                  <Grid key={elementId + "2"} item xs={4} marginY={4}>
                    {TableChart(label, dataFields[field], currentEntityData.length)}
                  </Grid>
                </Grid>
              </div>
            );
          })}
          {tokenWeightComponent}
        </Grid>
      );
    });

    // PoolTVL warning check
    const poolLevelTVL = parseFloat(data[poolKeySingular]?.totalValueLockedUSD);
    if (issues.filter((x) => x.message === poolKeySingular && x.type === "TVL-").length === 0 && poolLevelTVL < 1000) {
      issues.push({ type: "TVL-", message: poolKeySingular });
    } else if (
      issues.filter((x) => x.message === poolKeySingular && x.type === "TVL+").length === 0 &&
      poolLevelTVL > 1000000000000
    ) {
      issues.push({ type: "TVL+", message: poolKeySingular });
    }
    if (issues.length > 0) {
      setWarning(issues);
    }

    const entityData = data[poolKeySingular];
    const poolSchema = SchemaTable(entityData, poolKeySingular, setWarning, poolData, issues);

    return (
      <div>
        <PoolDropDown
          poolId={poolId}
          setPoolId={(x) => setPoolId(x)}
          setWarning={(x) => setWarning(x)}
          markets={data[poolKeyPlural]}
        />
        {poolSchema}
        {poolEntityElements}
      </div>
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

export default PoolTab;
