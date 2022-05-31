import { Box, Grid, Typography } from "@mui/material";
import { useState } from "react";
import { Chart } from "../../common/chartComponents/Chart";
import { TableChart } from "../../common/chartComponents/TableChart";
import { negativeFieldList, ProtocolTypeEntityName, ProtocolTypeEntityNames } from "../../constants";
import { convertTokenDecimals, toDate } from "../../utils";
import SchemaTable from "../SchemaTable";
import IssuesDisplay from "../IssuesDisplay";
import { useEffect } from "react";
import { CopyLinkToClipboard } from "../../common/utilComponents/CopyLinkToClipboard";

interface ProtocolTabProps {
  data: any;
  entities: string[];
  entitiesData: { [x: string]: { [x: string]: string } };
  protocolFields: { [x: string]: string };
  protocolData: { [x: string]: any };
}

// This component is for each individual subgraph
function ProtocolTab({ data, entities, entitiesData, protocolFields, protocolData }: ProtocolTabProps) {
  const [issuesState, setIssues] = useState<{ message: string; type: string; level: string; fieldName: string }[]>([]);
  const issues: { message: string; type: string; level: string; fieldName: string }[] = issuesState;
  const list: { [x: string]: any } = {};
  const protocolEntityName = ProtocolTypeEntityNames[protocolData?.type];

  const excludedEntities = [
    "liquidityPoolHourlySnapshots",
    "liquidityPoolDailySnapshots",
    "marketHourlySnapshots",
    "marketDailySnapshots",
    "vaultHourlySnapshots",
    "vaultDailySnapshots",
  ];
  const protocolDataRender = entities.map((entityName: string) => {
    try {
      // Exclude the following entities because they are not on the protocol tab
      if (excludedEntities.includes(entityName)) {
        return null;
      }
      const currentEntityData = data[entityName];
      // If the current entity has no instances, return the following
      if (currentEntityData.length === 0) {
        return (
          <Box key={entityName}>
            <Typography variant="h4">ENTITY: {entityName}</Typography>
            <Typography variant="body1">{entityName} HAS NO TIMESERIES DATA.</Typography>
          </Box>
        );
      }
      // dataFields object has corresponding key:value pairs. Key is the field name and value is an array with an object holding the coordinates to be plotted on the chart for that entity field.
      const dataFields: { [dataField: string]: { date: number; value: number }[] } = {};
      // dataFieldMetrics is used to store sums, expressions, etc calculated upon certain certain datafields to check for irregularities in the data
      const dataFieldMetrics: { [dataField: string]: { [metric: string]: any } } = {};
      // For the current entity, loop through all instances of that entity
      for (let x = currentEntityData.length - 1; x >= 0; x--) {
        const timeseriesInstance: { [x: string]: any } = currentEntityData[x];
        // On the entity instance, loop through all of the entity fields within it
        // create the base yield field for DEXs
        if (timeseriesInstance.dailySupplySideRevenueUSD && timeseriesInstance.totalValueLockedUSD) {
          const value = (timeseriesInstance.dailySupplySideRevenueUSD / timeseriesInstance.totalValueLockedUSD) * 100;
          if (!dataFields.capitalEfficiency) {
            dataFields.capitalEfficiency = [{ value, date: Number(timeseriesInstance.timestamp) }];
            dataFieldMetrics.capitalEfficiency = { sum: value };
          } else {
            dataFields.capitalEfficiency.push({ value, date: Number(timeseriesInstance.timestamp) });
            dataFieldMetrics.capitalEfficiency.sum += value;
          }
        }
        Object.keys(timeseriesInstance).forEach((entityFieldName: string) => {
          // skip the timestamp field on each entity instance
          if (entityFieldName === "timestamp" || entityFieldName === "id") {
            return;
          }
          // The following section determines whether or not the current field on the entity is a numeric value or an array that contains numeric values
          const currentInstanceField = timeseriesInstance[entityFieldName];
          try {
            if (!isNaN(currentInstanceField) && !Array.isArray(currentInstanceField)) {
              // If the entity field is a numeric value, push it to the array corresponding to the field name in the dataFields array
              // Add the value to the sum field on the entity field name in the dataFieldMetrics obj
              if (!dataFields[entityFieldName]) {
                dataFields[entityFieldName] = [
                  { value: Number(currentInstanceField), date: Number(timeseriesInstance.timestamp) },
                ];
                dataFieldMetrics[entityFieldName] = { sum: Number(currentInstanceField) };
              } else {
                dataFields[entityFieldName].push({
                  value: Number(currentInstanceField),
                  date: Number(timeseriesInstance.timestamp),
                });
                dataFieldMetrics[entityFieldName].sum += Number(currentInstanceField);
              }
              if (Number(currentInstanceField) < 0) {
                if (!dataFieldMetrics[entityFieldName].negative) {
                  // Capture the first snapshot (if there are multiple) where a value was negative. Count is cumulative
                  dataFieldMetrics[entityFieldName].negative = {
                    firstSnapshot: timeseriesInstance.id,
                    value: Number(currentInstanceField),
                    count: 0,
                  };
                }
                dataFieldMetrics[entityFieldName].negative.count += 1;
              }
              if (entityFieldName.includes("umulative")) {
                if (!Object.keys(dataFieldMetrics[entityFieldName]).includes("cumulative")) {
                  dataFieldMetrics[entityFieldName].cumulative = { prevVal: 0, hasLowered: "" };
                }
                if (Number(currentInstanceField) < dataFieldMetrics[entityFieldName]?.cumulative?.prevVal) {
                  dataFieldMetrics[entityFieldName].cumulative.hasLowered = timeseriesInstance.id;
                }
                dataFieldMetrics[entityFieldName].cumulative.prevVal = Number(currentInstanceField);
              }
            } else if (Array.isArray(currentInstanceField)) {
              // if the current entity field is an array, loop through it and create separate dataField keys for each index of the array
              // This way, each index on the field will have its own chart (ie rewardTokenEmissions[0] and rewardTokenEmissions[1] have their own charts)
              // currentInstanceField.forEach((val: string, arrayIndex: number) => {
              for (let arrayIndex = 0; arrayIndex < currentInstanceField.length; arrayIndex++) {
                const val = currentInstanceField[arrayIndex];
                const dataFieldKey = entityFieldName + " [" + arrayIndex + "]";
                let value = Number(val);
                try {
                  if (entityFieldName === "mintedTokenSupplies" && data[protocolEntityName][0]?.lendingType === "CDP") {
                    if (data[protocolEntityName][0]?.mintedTokens.length > 0) {
                      value = convertTokenDecimals(val, data[protocolEntityName][0].mintedTokens[arrayIndex]?.decimals);
                    }
                  } else if (
                    entityFieldName === "mintedTokenSupplies" &&
                    data[protocolEntityName][0]?.lendingType !== "CDP"
                  ) {
                    continue;
                  }
                } catch (err) {
                  console.error("ERR - COULD NOT GET MINTED TOKEN DECIMALS", err);
                }
                if (!dataFields[dataFieldKey]) {
                  dataFields[dataFieldKey] = [{ value: value, date: Number(timeseriesInstance.timestamp) }];
                  dataFieldMetrics[dataFieldKey] = { sum: value };
                } else {
                  dataFields[dataFieldKey].push({ value: value, date: Number(timeseriesInstance.timestamp) });
                  dataFieldMetrics[dataFieldKey].sum += value;
                }
                if (Number(value) < 0) {
                  if (!dataFieldMetrics[entityFieldName].negative) {
                    // Capture the first snapshot (if there are multiple) where a value was negative. Count is cumulative
                    dataFieldMetrics[entityFieldName].negative = {
                      firstSnapshot: timeseriesInstance.id,
                      value: Number(value),
                      count: 0,
                    };
                  }
                  dataFieldMetrics[entityFieldName].negative.count += 1;
                }
                if (dataFieldKey.includes("umulative")) {
                  if (!Object.keys(dataFieldMetrics[dataFieldKey]).includes("cumulative")) {
                    dataFieldMetrics[dataFieldKey].cumulative = { prevVal: 0, hasLowered: "" };
                  }
                  if (value < dataFieldMetrics[dataFieldKey].cumulative.prevVal) {
                    dataFieldMetrics[dataFieldKey].cumulative.hasLowered = timeseriesInstance.id;
                  }
                  dataFieldMetrics[dataFieldKey].cumulative.prevVal = value;
                }
              }
            }
          } catch (err) {
            if (
              issues.filter((x) => x.fieldName === entityName + "-" + entityFieldName && x.type === "JS")?.length === 0
            ) {
              let message = "JAVASCRIPT ERROR";
              if (err instanceof Error) {
                message = err.message;
              }
              issues.push({
                type: "JS",
                message: message,
                level: "critical",
                fieldName: entityName + "-" + entityFieldName,
              });
            }
          }
        });
      }

      list[entityName] = {};
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

      if (dataFields.protocolControlledValueUSD) {
        const capitalEfficiency = dataFields.capitalEfficiency;
        delete dataFields.capitalEfficiency;
        dataFields.capitalEfficiency = capitalEfficiency;
      }

      if (dataFields.protocolControlledValueUSD) {
        const protocolControlledValueUSD = dataFields.protocolControlledValueUSD;
        delete dataFields.protocolControlledValueUSD;
        dataFields.protocolControlledValueUSD = protocolControlledValueUSD;
      }

      console.log("DATAFIELDSOBJ-PROTOCOL", dataFields);

      // For each entity field/key in the dataFields object, create a chart and tableChart component
      // If the sum of all values for a chart is 0, display a warning that the entity is not properly collecting data
      return (
        <Grid key={entityName}>
          <Box my={3}>
            <CopyLinkToClipboard link={window.location.href} scrollId={entityName}>
              <Typography variant="h4" id={entityName}>
                {entityName}
              </Typography>
            </CopyLinkToClipboard>
          </Box>
          {Object.keys(dataFields).map((field: string) => {
            // The following checks if the field is required or can be null
            const fieldName = field.split(" [")[0];
            if (entitiesData[entityName][fieldName]) {
              const schemaFieldTypeString = entitiesData[entityName][fieldName]?.split("");
              if (schemaFieldTypeString[schemaFieldTypeString?.length - 1] !== "!") {
                // return null;
              }
            }
            const label = entityName + "-" + field;
            const elementId = label.split(" ").join("%20");

            try {
              if (
                issues.filter((x) => x.message === label && x.type === "SUM")?.length === 0 &&
                dataFieldMetrics[field]?.sum === 0
              ) {
                // Create a warning for the 0 sum of all snapshots for this field
                const schemaField = Object.keys(entitiesData[entityName]).find((fieldSchema: string) => {
                  return fieldName.toUpperCase().includes(fieldSchema.toUpperCase());
                });
                let level = "warning";
                if (schemaField) {
                  const fieldChars = entitiesData[entityName][schemaField].split("");
                  if (fieldChars[fieldChars.length - 1] === "!") {
                    level = "error";
                  }
                }
                issues.push({ type: "SUM", message: "", fieldName: label, level });
              }
              if (
                issues.filter((x) => x.fieldName === label && x.type === "CUMULATIVE")?.length === 0 &&
                dataFieldMetrics[field]?.cumulative?.hasLowered?.length > 0
              ) {
                issues.push({
                  type: "CUMULATIVE",
                  message: dataFieldMetrics[field]?.cumulative?.hasLowered,
                  level: "error",
                  fieldName: label,
                });
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
            } catch (err) {
              console.log("ERROR RENDER", err);
              let message = "JAVASCRIPT ERROR";
              if (err instanceof Error) {
                message = err.message;
              }
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
                  <Box mt={3} mb={1} style={{ borderTop: "2px solid #B8301C", borderBottom: "2px solid #B8301C" }}>
                    <CopyLinkToClipboard link={window.location.href} scrollId={elementId}>
                      <Typography variant="h6">
                        {field} - {message}
                      </Typography>
                    </CopyLinkToClipboard>
                  </Box>
                </div>
              );
            }
            return (
              <div key={elementId} id={elementId}>
                <Box mt={3} mb={1}>
                  <CopyLinkToClipboard link={window.location.href} scrollId={elementId}>
                    <Typography variant="h6">{field}</Typography>
                  </CopyLinkToClipboard>
                </Box>
                <Grid container justifyContent="space-between">
                  <Grid key={label + "1"} item xs={7.5}>
                    <Chart datasetLabel={label} dataChart={dataFields[field]} />
                  </Grid>
                  <Grid key={label + "2"} item xs={4}>
                    <TableChart
                      datasetLabel={label}
                      dataTable={dataFields[field]}
                    />
                  </Grid>
                </Grid>
              </div>
            );
          })}
        </Grid>
      );
    } catch (err) {
      if (err instanceof Error) {
        console.log("CATCH", Object.keys(err), Object.values(err), err);
        return <h3>JAVASCRIPT ERROR - PROTOCOL TAB - {err.message}</h3>;
      } else {
        return <h3>JAVASCRIPT ERROR - PROTOCOL TAB</h3>;
      }
    }
  });

  const protTypeEntity = ProtocolTypeEntityNames[protocolData?.type];
  const protocolLevelTVL = parseFloat(data[protTypeEntity][0]?.totalValueLockedUSD);
  if (
    issues.filter((x) => x.fieldName === protTypeEntity && x.type === "TVL-").length === 0 &&
    protocolLevelTVL < 1000
  ) {
    issues.push({ type: "TVL-", message: "", level: "critical", fieldName: protTypeEntity });
  } else if (
    issues.filter((x) => x.fieldName === protTypeEntity && x.type === "TVL+").length === 0 &&
    protocolLevelTVL > 1_000_000_000_000
  ) {
    issues.push({ type: "TVL+", message: "", level: "critical", fieldName: protTypeEntity });
  }

  useEffect(() => {
    console.log("PROTOCOL ISSUES TO SET", issues, issuesState);
    setIssues(issues);
  }, [issuesState]);

  return (
    <>
      <IssuesDisplay issuesArrayProps={issuesState} />
      <SchemaTable
        entityData={protocolData}
        schemaName={ProtocolTypeEntityName[protocolData?.type]}
        setIssues={(x) => setIssues(x)}
        dataFields={protocolFields}
        issuesProps={issuesState}
      />
      {protocolDataRender}
    </>
  );
}

export default ProtocolTab;
