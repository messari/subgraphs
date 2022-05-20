import { Box, Grid, Typography } from "@mui/material";
import { useState } from "react";
import { Chart } from "../../common/chartComponents/Chart";
import { TableChart } from "../../common/chartComponents/TableChart";
import { ProtocolTypeEntity } from "../../constants";
import { convertTokenDecimals } from "../../utils";
import SchemaTable from "../SchemaTable";
import IssuesDisplay from "../IssuesDisplay";
import { useEffect } from "react";
import { CopyLinkToClipboard } from "../../common/utilComponents/CopyLinkToClipboard";

interface ProtocolTabProps {
  data: any;
  entities: string[];
  entitiesData: { [x: string]: { [x: string]: string } };
  protocolFields: { [x: string]: string };
}

// This component is for each individual subgraph
function ProtocolTab({ data, entities, entitiesData, protocolFields }: ProtocolTabProps) {
  const [issuesState, setIssues] = useState<{ message: string; type: string; level: string; fieldName: string }[]>([]);
  const issues: { message: string; type: string; level: string; fieldName: string }[] = issuesState;
  const list: { [x: string]: any } = {};
  const protocolEntityName = ProtocolTypeEntity[data.protocols[0].type];

  const excludedEntities = [
    "liquidityPoolHourlySnapshots",
    "liquidityPoolDailySnapshots",
    "marketHourlySnapshots",
    "marketDailySnapshots",
    "vaultHourlySnapshots",
    "vaultDailySnapshots",
  ];
  const protocolData = entities.map((entityName: string) => {
    try {
      // Exclude the following entities because they are not on the protocol tab
      if (excludedEntities.includes(entityName)) {
        return null;
      }
      const currentEntityData = data[entityName];
      // If the current entity has no instances, return the following
      if (currentEntityData.length === 0) {
        return (
          <Grid key={entityName} style={{ borderTop: "black 2px solid" }}>
            <h2>ENTITY: {entityName}</h2>
            <h3 style={{ color: "red" }}>{entityName} HAS NO INSTANCES.</h3>
          </Grid>
        );
      }
      // dataFields object has corresponding key:value pairs. Key is the field name and value is an array with an object holding the coordinates to be plotted on the chart for that entity field.
      const dataFields: { [dataField: string]: [{ date: number; value: number }] } = {};
      // dataFieldMetrics is used to store sums, expressions, etc calculated upon certain certain datafields to check for irregularities in the data
      const dataFieldMetrics: { [dataField: string]: { [metric: string]: any } } = {};
      // For the current entity, loop through all instances of that entity
      for (let x = currentEntityData.length - 1; x >= 0; x--) {
        const entityInstance: { [x: string]: any } = currentEntityData[x];
        // On the entity instance, loop through all of the entity fields within it
        // create the base yield field for DEXs
        if (entityInstance.dailySupplySideRevenueUSD && entityInstance.totalValueLockedUSD) {
          const value = (entityInstance.dailySupplySideRevenueUSD / entityInstance.totalValueLockedUSD) * 100;
          if (!dataFields.capitalEfficiency) {
            dataFields.capitalEfficiency = [{ value, date: Number(entityInstance.timestamp) }];
            dataFieldMetrics.capitalEfficiency = { sum: value };
          } else {
            dataFields.capitalEfficiency.push({ value, date: Number(entityInstance.timestamp) });
            dataFieldMetrics.capitalEfficiency.sum += value;
          }
        }
        // entityInstance.dailySupplySideRevenue / totalValueLockedUSD * 100
        Object.keys(entityInstance).forEach((entityFieldName: string) => {
          // skip the timestamp field on each entity instance
          if (entityFieldName === "timestamp") {
            return;
          }
          // The following section determines whether or not the current field on the entity is a numeric value or an array that contains numeric values
          const currentInstanceField = entityInstance[entityFieldName];
          if (!isNaN(currentInstanceField) && !Array.isArray(currentInstanceField)) {
            // If the entity field is a numeric value, push it to the array corresponding to the field name in the dataFields array
            // Add the value to the sum field on the entity field name in the dataFieldMetrics obj
            if (!dataFields[entityFieldName]) {
              dataFields[entityFieldName] = [
                { value: Number(currentInstanceField), date: Number(entityInstance.timestamp) },
              ];
              dataFieldMetrics[entityFieldName] = { sum: Number(currentInstanceField) };
            } else {
              dataFields[entityFieldName].push({
                value: Number(currentInstanceField),
                date: Number(entityInstance.timestamp),
              });
              dataFieldMetrics[entityFieldName].sum += Number(currentInstanceField);
            }
            if (entityFieldName.includes("umulative")) {
              if (!Object.keys(dataFieldMetrics[entityFieldName]).includes("cumulative")) {
                dataFieldMetrics[entityFieldName].cumulative = { prevVal: 0, hasLowered: 0 };
              }
              if (Number(currentInstanceField) < dataFieldMetrics[entityFieldName].cumulative.prevVal) {
                dataFieldMetrics[entityFieldName].cumulative.hasLowered = Number(entityInstance.timestamp);
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
                dataFields[dataFieldKey] = [{ value: value, date: Number(entityInstance.timestamp) }];
                dataFieldMetrics[dataFieldKey] = { sum: value };
              } else {
                dataFields[dataFieldKey].push({ value: value, date: Number(entityInstance.timestamp) });
                dataFieldMetrics[dataFieldKey].sum += value;
              }
              if (dataFieldKey.includes("umulative")) {
                if (!Object.keys(dataFieldMetrics[dataFieldKey]).includes("cumulative")) {
                  dataFieldMetrics[dataFieldKey].cumulative = { prevVal: 0, hasLowered: 0 };
                }
                if (value < dataFieldMetrics[dataFieldKey].cumulative.prevVal) {
                  dataFieldMetrics[dataFieldKey].cumulative.hasLowered = Number(entityInstance.timestamp);
                }
                dataFieldMetrics[dataFieldKey].cumulative.prevVal = value;
              }
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
            if (
              issues.filter((x) => x.message === label && x.type === "SUM").length === 0 &&
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
                  level = "critical";
                }
              }
              issues.push({ type: "SUM", message: "", fieldName: label, level });
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
            const elementId = label.split(" ").join("%20");
            return (
              <div id={elementId}>
                <Box mt={3} mb={1}>
                  <CopyLinkToClipboard link={window.location.href} scrollId={elementId}>
                    <Typography variant="h6">{field}</Typography>
                  </CopyLinkToClipboard>
                </Box>
                <Grid container justifyContent="space-between">
                  <Grid key={label + "1"} item xs={7.5}>
                    {Chart(label, dataFields[field], currentEntityData.length)}
                  </Grid>
                  <Grid key={label + "2"} item xs={4}>
                    {TableChart(label, dataFields[field], currentEntityData.length)}
                  </Grid>
                </Grid>
              </div>
            );
          })}
        </Grid>
      );
    } catch (err) {
      if (err instanceof Error) {
        console.log("CATCH,", Object.keys(err), Object.values(err), err);
        return <h3>JAVASCRIPT ERROR - PROTOCOL TAB - {err.message}</h3>;
      } else {
        return <h3>JAVASCRIPT ERROR - PROTOCOL TAB</h3>;
      }
    }
  });

  const protTypeEntity = ProtocolTypeEntity[data.protocols[0].type];
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
      <IssuesDisplay issuesArray={issuesState} />
      <SchemaTable
        entityData={data[protTypeEntity][0]}
        schemaName={protTypeEntity}
        setIssues={(x) => setIssues(x)}
        dataFields={protocolFields}
        issuesProps={issuesState}
      />
      {protocolData}
    </>
  );
}

export default ProtocolTab;
