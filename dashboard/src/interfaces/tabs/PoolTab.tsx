import { Grid, Paper, Table, TableBody, TableCell, TableContainer, TableRow } from "@mui/material";
import { Chart } from "../../common/chartComponents/Chart";
import { TableChart } from "../../common/chartComponents/TableChart";
import { poolDropDown } from "../../common/utilComponents/PoolDropDown";
import { PoolName, PoolNames, Versions } from "../../constants";
import SchemaTable from "../SchemaTable";
import { convertTokenDecimals } from "../../utils/index";

function PoolTab(
  data: any,
  entities: string[],
  entitiesData: { [x: string]: { [x: string]: string } },
  poolId: string,
  setPoolId: React.Dispatch<React.SetStateAction<string>>,
  poolData: { [x: string]: string },
  setWarning: React.Dispatch<React.SetStateAction<{ message: string, type: string }[]>>,
  warning: { message: string, type: string }[]
) {
  try {
    const poolName = PoolName[data.protocols[0].type];
    const poolNames = PoolNames[data.protocols[0].type];

    const issues: { message: string, type: string }[] = warning;
    const excludedEntities = [
      "financialsDailySnapshots",
      "usageMetricsDailySnapshots",
      "usageMetricsHourlySnapshots"
    ]
    const poolEntityElements = entities.map((entityName: string) => {
      if (!poolId) {
        return null;
      }
      if (excludedEntities.includes(entityName)) {
        return null;
      }
      const currentEntityData = data[entityName];
      if (currentEntityData.length === 0) {
        return <Grid key={entityName} style={{ borderTop: "black 2px solid" }}><h2>ENTITY: {entityName}</h2><h3 style={{ color: "red" }}>{entityName} HAS NO INSTANCES.</h3></Grid>
      }
      const dataFields: { [dataField: string]: [{ date: number, value: number }] } = {};
      // dataFieldMetrics is used to store sums, expressions, etc calculated upon certain certain datafields to check for irregularities in the data
      const dataFieldMetrics: { [dataField: string]: { [metric: string]: any } } = {}
      for (let x = currentEntityData.length - 1; x > 0; x--) {
        const entityInstance: { [x: string]: any } = currentEntityData[x];
        Object.keys(entityInstance).forEach((entityFieldName: string) => {
          if (entityFieldName === 'timestamp') {
            return;
          }
          const currentInstanceField = entityInstance[entityFieldName];
          if (!isNaN(currentInstanceField) && !Array.isArray(currentInstanceField)) {
            let value = Number(currentInstanceField);
            if (entityFieldName === 'inputTokenBalance') {
              const dec = data[poolName].inputToken.decimals;
              value = convertTokenDecimals(currentInstanceField, dec);
            }
            if (entityFieldName === 'outputTokenSupply') {
              const dec = data[poolName].outputToken.decimals;
              value = convertTokenDecimals(currentInstanceField, dec);
            }
            if (entityFieldName === 'stakedOutputTokenAmount') {
              const dec = data[poolName].outputToken.decimals;
              value = convertTokenDecimals(currentInstanceField, dec);
            }
            if (!dataFields[entityFieldName]) {
              dataFields[entityFieldName] = [{ value: value, date: Number(entityInstance.timestamp) }];
              dataFieldMetrics[entityFieldName] = { sum: value };
            } else {
              dataFields[entityFieldName].push({ value: value, date: Number(entityInstance.timestamp) });
              dataFieldMetrics[entityFieldName].sum += value;
            }
            if (entityFieldName.includes('umulative')) {
              if (!Object.keys(dataFieldMetrics[entityFieldName]).includes('cumulative')) {
                dataFieldMetrics[entityFieldName].cumulative = { prevVal: 0, hasLowered: 0 }
              }
              if (value < dataFieldMetrics[entityFieldName].cumulative.prevVal) {
                dataFieldMetrics[entityFieldName].cumulative.hasLowered = Number(entityInstance.timestamp);
              }
              dataFieldMetrics[entityFieldName].cumulative.prevVal = value;
            }
            if (entityFieldName.includes('umulative')) {
              if (!Object.keys(dataFieldMetrics[entityFieldName]).includes('cumulative')) {
                dataFieldMetrics[entityFieldName].cumulative = { prevVal: 0, hasLowered: 0 }
              }
              if (Number(currentInstanceField) < dataFieldMetrics[entityFieldName].cumulative.prevVal) {
                dataFieldMetrics[entityFieldName].cumulative.hasLowered = Number(entityInstance.timestamp);
              }
              dataFieldMetrics[entityFieldName].cumulative.prevVal = Number(currentInstanceField);
            }
          } else if (Array.isArray(currentInstanceField)) {
            currentInstanceField.forEach((val: string, arrayIndex: number) => {
              let fieldSplitIdentifier = arrayIndex.toString();
              let value: number = 0;
              if (!isNaN(Number(val))) {
                value = Number(val);
              } else if (typeof (val) === 'object') {
                const holdingValueKey = Object.keys(val).find(x => {
                  return !isNaN(Number(val[x]));
                });
                if (holdingValueKey) {
                  value = Number(val[holdingValueKey]);
                }
                if (val['type']) {
                  fieldSplitIdentifier = val['type'];
                } else {
                  const holdingValueStr = Object.keys(val).find(x => {
                    return typeof (val[x]) === "string" && isNaN(Number(val[x]));
                  });
                  if (holdingValueStr) {
                    fieldSplitIdentifier = holdingValueStr;
                  }
                }
              }
              const dataFieldKey = entityFieldName + ' [' + fieldSplitIdentifier + ']';
              try {
                if (entityFieldName === 'inputTokenBalances') {
                  value = convertTokenDecimals(val, data[poolName].inputTokens[arrayIndex].decimals);
                }
                if (entityFieldName === 'rewardTokenEmissionsAmount') {
                  const currentRewardToken = data[poolName].rewardTokens[arrayIndex];
                  if (currentRewardToken.decimals) {
                    value = convertTokenDecimals(val, currentRewardToken?.decimals);
                  } else if (currentRewardToken?.token?.decimals) {
                    value = convertTokenDecimals(val, currentRewardToken?.token?.decimals);
                  } else {
                    value = convertTokenDecimals(val, 18);
                    issues.push({ type: "DEC", message: poolName + '-' + entityFieldName + '-' + arrayIndex });
                  }
                }
                if (entityFieldName === 'rewardTokenEmissionsUSD') {
                  //Convert emissions amount in USD to APY/APR
                  // total reward emission USD / total staked USD * 100 = reward APR
                  if (entityInstance?.stakedOutputTokenAmount) {
                    value = Number(val) / (entityInstance.outputTokenPriceUSD * entityInstance.stakedOutputTokenAmount) * 100 * 365;
                  } else if (entityInstance?.totalDepositBalanceUSD) {
                    value = Number(val) / entityInstance.totalDepositBalanceUSD * 100 * 365;
                  } else {
                    value = Number(val) / entityInstance.totalValueLockedUSD * 100 * 365;
                  }

                }
              } catch (err) {
                if (err instanceof Error) {
                  issues.push({ type: "DEC", message: poolName + '-' + entityFieldName + '-' + arrayIndex })
                }
              }
              if (!dataFields[dataFieldKey]) {
                dataFields[dataFieldKey] = [{ value: value, date: Number(entityInstance.timestamp) }];
                dataFieldMetrics[dataFieldKey] = { sum: value };
              } else {
                dataFields[dataFieldKey].push({ value: value, date: Number(entityInstance.timestamp) });
                dataFieldMetrics[dataFieldKey].sum += value;
              }
              if (dataFieldKey.includes('umulative')) {
                if (!Object.keys(dataFieldMetrics[dataFieldKey]).includes('cumulative')) {
                  dataFieldMetrics[dataFieldKey].cumulative = { prevVal: 0, hasLowered: 0 }
                }
                if (value < dataFieldMetrics[dataFieldKey].cumulative.prevVal) {
                  dataFieldMetrics[dataFieldKey].cumulative.hasLowered = Number(entityInstance.timestamp);
                }
                dataFieldMetrics[dataFieldKey].cumulative.prevVal = value;
              }
              if (dataFieldKey.includes('umulative')) {
                if (!Object.keys(dataFieldMetrics[dataFieldKey]).includes('cumulative')) {
                  dataFieldMetrics[dataFieldKey].cumulative = { prevVal: 0, hasLowered: 0 }
                }
                if (Number(val) < dataFieldMetrics[dataFieldKey].cumulative.prevVal) {
                  dataFieldMetrics[dataFieldKey].cumulative.hasLowered = Number(entityInstance.timestamp);
                }
                dataFieldMetrics[dataFieldKey].cumulative.prevVal = Number(val);
              }
            });
          }
        });
      };
      return (
        <Grid key={entityName} style={{ borderTop: "black 2px solid" }} container>
          <h2>ENTITY: {entityName} - {poolId}</h2>{
            Object.keys(dataFields).map((field: string) => {
              const fieldName = field.split(' [')[0];
              const schemaFieldTypeString = entitiesData[entityName][fieldName].split("");
              if (schemaFieldTypeString[schemaFieldTypeString.length - 1] !== '!') {
                return null;
              }
              const label = entityName + '-' + field;
              if (dataFieldMetrics[field].sum === 0 && issues.filter(x => x.message === label).length === 0) {
                // The error message is more to be used as data on how to handle the error. Syntax is ERRORTYPE%%ENTITY--FIELD
                issues.push({ type: "SUM", message: label });
              }
              if (issues.filter(x => x.message === label && x.type === "CUMULATIVE").length === 0 && dataFieldMetrics[field]?.cumulative?.hasLowered > 0) {
                issues.push({ type: "CUMULATIVE", message: label + '++' + dataFieldMetrics[field].cumulative.hasLowered });
              }
              return (<>
                <Grid key={label + '1'} id={label} item xs={8}>
                  {Chart(label, dataFields[field], currentEntityData.length)}
                </Grid>
                <Grid key={label + '2'} item xs={4} marginY={4}>
                  {TableChart(label, dataFields[field], currentEntityData.length)}
                </Grid>
              </>)
            })
          }</Grid>)
    })

    const poolLevelTVL = parseFloat(data[poolName]?.totalValueLockedUSD)
    if (issues.filter(x => x.message === poolName && x.type === "TVL-").length === 0 && poolLevelTVL < 1000) {
      issues.push({ type: "TVL-", message: poolName });
    } else if (issues.filter(x => x.message === poolName && x.type === "TVL+").length === 0 && poolLevelTVL > 1000000000000) {
      issues.push({ type: "TVL+", message: poolName });
    }
    if (issues.length > 0) {
      setWarning(issues);
    }

    const poolSchema = SchemaTable(data[poolName], poolName, setWarning, poolData, warning);
    return (
      <div>
        {poolDropDown(poolId, setPoolId, setWarning, data[poolNames])}
        {poolSchema}
        {poolEntityElements}
      </div>);

  } catch (err) {
    if (err instanceof Error) {
      console.log('CATCH,', Object.keys(err), Object.values(err), err)
      return <h3>JAVASCRIPT ERROR {err.message}</h3>
    } else {
      return <h3>JAVASCRIPT ERROR</h3>
    }
  }
}

export default PoolTab;