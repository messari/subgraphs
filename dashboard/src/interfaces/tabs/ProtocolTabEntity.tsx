import { Box, Button, CircularProgress, Grid, Typography } from "@mui/material";
import { negativeFieldList } from "../../constants";
import { convertTokenDecimals, downloadCSV } from "../../utils";
import { useEffect, useState } from "react";
import { CopyLinkToClipboard } from "../../common/utilComponents/CopyLinkToClipboard";
import { BigNumber } from "bignumber.js";
import { ChartContainer } from "../../common/chartComponents/ChartContainer";
import moment from "moment";

interface ProtocolTabEntityProps {
  entitiesData: { [x: string]: { [x: string]: string } };
  entityName: string;
  protocolType: string;
  protocolTableData: { [x: string]: any };
  currentEntityData: any;
  currentOverlayEntityData: any;
  currentTimeseriesLoading: any;
  currentTimeseriesError: any;
  issuesProps: { [x: string]: { message: string; type: string; level: string; fieldName: string }[] };
  setIssues: React.Dispatch<{ [x: string]: { message: string; type: string; level: string; fieldName: string }[] }>;
}

// This component is for each individual subgraph
function ProtocolTabEntity({
  entitiesData,
  entityName,
  protocolType,
  protocolTableData,
  currentEntityData,
  currentOverlayEntityData,
  currentTimeseriesLoading,
  currentTimeseriesError,
  issuesProps,
  setIssues,
}: ProtocolTabEntityProps) {
  const issues: { message: string; type: string; level: string; fieldName: string }[] = [];
  const list: { [x: string]: any } = {};

  const [downloadAllCharts, triggerDownloadAllCharts] = useState<boolean>(false);

  useEffect(() => {
    const issuesToSet = { ...issuesProps };
    issuesToSet[entityName] = issues;
    setIssues(issuesToSet);
  });

  useEffect(() => {
    if (!!downloadAllCharts) {
      triggerDownloadAllCharts(false);
    }
  }, [downloadAllCharts])

  if (!currentTimeseriesLoading && currentEntityData) {
    try {
      // If the current entity has no instances, return the following
      if (currentEntityData?.length === 0) {
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
      const overlayDataFields: { [dataField: string]: { date: number; value: number }[] } = {};

      const overlayDifference = currentEntityData.length - currentOverlayEntityData.length;
      for (let x = currentEntityData.length - 1; x >= 0; x--) {
        const timeseriesInstance: { [x: string]: any } = currentEntityData[x];
        const overlayTimeseriesInstance: { [x: string]: any } = currentOverlayEntityData[x - overlayDifference];
        // On the entity instance, loop through all of the entity fields within it
        // create the base yield field for DEXs
        Object.keys(timeseriesInstance).forEach((fieldName: string) => {
          // skip the timestamp field on each entity instance
          if (fieldName === "timestamp" || fieldName === "id") {
            return;
          }
          // The following section determines whether or not the current field on the entity is a numeric value or an array that contains numeric values
          const currentInstanceField = timeseriesInstance[fieldName];
          let currentOverlayInstanceField: any = {};
          if (overlayTimeseriesInstance) {
            if (Object.keys(overlayTimeseriesInstance).includes(fieldName)) {
              currentOverlayInstanceField = overlayTimeseriesInstance[fieldName];
            }
          }
          try {
            if (!isNaN(currentInstanceField) && !Array.isArray(currentInstanceField)) {
              // If the entity field is a numeric value, push it to the array corresponding to the field name in the dataFields array
              // Add the value to the sum field on the entity field name in the dataFieldMetrics obj
              if (!dataFields[fieldName]) {
                dataFields[fieldName] = [
                  { value: Number(currentInstanceField), date: Number(timeseriesInstance.timestamp) },
                ];
                dataFieldMetrics[fieldName] = { sum: Number(currentInstanceField) };
              } else {
                dataFields[fieldName].push({
                  value: Number(currentInstanceField),
                  date: Number(timeseriesInstance.timestamp),
                });
                dataFieldMetrics[fieldName].sum += Number(currentInstanceField);
              }
              if (Number(currentInstanceField) < 0) {
                if (!dataFieldMetrics[fieldName].negative) {
                  // Capture the first snapshot (if there are multiple) where a value was negative. Count is cumulative
                  dataFieldMetrics[fieldName].negative = {
                    firstSnapshot: timeseriesInstance.id,
                    value: Number(currentInstanceField),
                    count: 0,
                  };
                }
                dataFieldMetrics[fieldName].negative.count += 1;
              }
              if (fieldName.endsWith("TotalRevenueUSD") && !dataFieldMetrics[fieldName].revSumMismatch) {
                // store ID of first instance where total rev != supply + protocol rev
                const fieldSplit = fieldName.split("TotalRevenueUSD");
                const totalRevenue = new BigNumber(dataFieldMetrics[`${fieldSplit[0]}TotalRevenueUSD`].sum);
                const sumRevenue = new BigNumber(dataFieldMetrics[`${fieldSplit[0]}ProtocolSideRevenueUSD`].sum).plus(
                  new BigNumber(dataFieldMetrics[`${fieldSplit[0]}SupplySideRevenueUSD`].sum),
                );
                if (!sumRevenue.isEqualTo(totalRevenue)) {
                  const divergence = totalRevenue.minus(sumRevenue).div(totalRevenue).times(100).toNumber().toFixed(1);
                  dataFieldMetrics[fieldName].revSumMismatch = {
                    timeSeriesInstanceId: timeseriesInstance.id,
                    totalRevenue,
                    sumRevenue,
                    divergence,
                  };
                }
              }
              if (fieldName.endsWith("TransactionCount") && !dataFieldMetrics[fieldName].txSumMismatch) {
                // store ID of first instance where total tx != sum of all individual tx
                const individualTxCountKeys = Object.keys(timeseriesInstance).filter(
                  (field) =>
                    (field.startsWith("daily") || field.startsWith("hourly")) &&
                    field.endsWith("Count") &&
                    !field.endsWith("TransactionCount"),
                );
                const individualTxSum = individualTxCountKeys.reduce(
                  (prev, currentKey) => prev.plus(new BigNumber(timeseriesInstance[currentKey])),
                  new BigNumber(0),
                );

                const totalTxKey = Object.keys(timeseriesInstance).find((field) => field.endsWith("TransactionCount"));
                const totalTx = new BigNumber(totalTxKey || 0);

                if (!individualTxSum.isEqualTo(totalTx)) {
                  const divergence = totalTx.minus(individualTxSum).div(totalTx).times(100).toNumber().toFixed(1);
                  dataFieldMetrics[fieldName].txSumMismatch = {
                    timeSeriesInstanceId: timeseriesInstance.id,
                    individualTxSum,
                    totalTx,
                    divergence,
                  };
                }
              }
              if (fieldName.includes("umulative")) {
                if (!Object.keys(dataFieldMetrics[fieldName]).includes("cumulative")) {
                  dataFieldMetrics[fieldName].cumulative = { prevVal: 0, hasLowered: "" };
                }
                if (Number(currentInstanceField) < dataFieldMetrics[fieldName]?.cumulative?.prevVal) {
                  dataFieldMetrics[fieldName].cumulative.hasLowered = timeseriesInstance.id;
                }
                dataFieldMetrics[fieldName].cumulative.prevVal = Number(currentInstanceField);
              }
            } else if (Array.isArray(currentInstanceField)) {
              // if the current entity field is an array, loop through it and create separate dataField keys for each index of the array
              // This way, each index on the field will have its own chart (ie rewardTokenEmissions[0] and rewardTokenEmissions[1] have their own charts)
              // currentInstanceField.forEach((val: string, arrayIndex: number) => {
              for (let arrayIndex = 0; arrayIndex < currentInstanceField.length; arrayIndex++) {
                const val = currentInstanceField[arrayIndex];
                const dataFieldKey = fieldName + " [" + arrayIndex + "]";
                let value = Number(val);
                try {
                  if (fieldName === "mintedTokenSupplies" && protocolTableData?.lendingType === "CDP") {
                    if (protocolTableData?.mintedTokens.length > 0) {
                      value = convertTokenDecimals(val, protocolTableData.mintedTokens[arrayIndex]?.decimals);
                    }
                  } else if (fieldName === "mintedTokenSupplies" && protocolTableData?.lendingType !== "CDP") {
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
                  if (!dataFieldMetrics[fieldName].negative) {
                    // Capture the first snapshot (if there are multiple) where a value was negative. Count is cumulative
                    dataFieldMetrics[fieldName].negative = {
                      firstSnapshot: timeseriesInstance.id,
                      value: Number(value),
                      count: 0,
                    };
                  }
                  dataFieldMetrics[fieldName].negative.count += 1;
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

            if (x < overlayDifference && currentOverlayEntityData.length > 0) {
              overlayDataFields[fieldName] = [
                { value: 0, date: Number(timeseriesInstance.timestamp) },
                ...overlayDataFields[fieldName],
              ];
            } else if (overlayTimeseriesInstance) {
              if (!isNaN(currentOverlayInstanceField) && !Array.isArray(currentOverlayInstanceField)) {
                // If the entity field is a numeric value, push it to the array corresponding to the field name in the dataFields array
                // Add the value to the sum field on the entity field name in the dataFieldMetrics obj
                if (!overlayDataFields[fieldName]) {
                  overlayDataFields[fieldName] = [
                    { value: Number(currentOverlayInstanceField), date: Number(overlayTimeseriesInstance.timestamp) },
                  ];
                } else {
                  overlayDataFields[fieldName].push({
                    value: Number(currentOverlayInstanceField),
                    date: Number(overlayTimeseriesInstance.timestamp),
                  });
                }

              } else if (Array.isArray(currentOverlayInstanceField)) {
                // if the current entity field is an array, loop through it and create separate dataField keys for each index of the array
                // This way, each index on the field will have its own chart (ie rewardTokenEmissions[0] and rewardTokenEmissions[1] have their own charts)
                // currentOverlayInstanceField.forEach((val: string, arrayIndex: number) => {
                for (let arrayIndex = 0; arrayIndex < currentOverlayInstanceField.length; arrayIndex++) {
                  const val = currentOverlayInstanceField[arrayIndex];
                  const dataFieldKey = fieldName + " [" + arrayIndex + "]";
                  let value = Number(val);
                  try {
                    if (fieldName === "mintedTokenSupplies" && protocolTableData?.lendingType === "CDP") {
                      if (protocolTableData?.mintedTokens.length > 0) {
                        value = convertTokenDecimals(val, protocolTableData.mintedTokens[arrayIndex]?.decimals);
                      }
                    } else if (fieldName === "mintedTokenSupplies" && protocolTableData?.lendingType !== "CDP") {
                      continue;
                    }
                  } catch (err) {
                    console.error("ERR - COULD NOT GET MINTED TOKEN DECIMALS", err);
                  }
                  if (!overlayDataFields[dataFieldKey]) {
                    overlayDataFields[dataFieldKey] = [{ value: value, date: Number(overlayTimeseriesInstance.timestamp) }];
                  } else {
                    overlayDataFields[dataFieldKey].push({ value: value, date: Number(overlayTimeseriesInstance.timestamp) });
                  }
                }
              }
            }
          } catch (err) {
            if (issues.filter((x) => x.fieldName === entityName + "-" + fieldName && x.type === "JS")?.length === 0) {
              let message = "JAVASCRIPT ERROR";
              if (err instanceof Error) {
                message = err.message;
              }
              issues.push({
                type: "JS",
                message: message,
                level: "critical",
                fieldName: entityName + "-" + fieldName,
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

      const mappedCurrentEntityData = currentEntityData.map((instance: any, idx: number) => {
        let instanceToSave: any = {};
        instanceToSave.date = moment.utc(Number(instance.timestamp) * 1000).format("YYYY-MM-DD");
        instanceToSave = { ...instanceToSave, ...instance };
        delete instanceToSave.__typename;
        return instanceToSave;
      }).sort((a: any, b: any) => (Number(a.timestamp) - Number(b.timestamp)));

      // For each entity field/key in the dataFields object, create a chart and tableChart component
      // If the sum of all values for a chart is 0, display a warning that the entity is not properly collecting data
      return (
        <Grid key={entityName}>
          <Box sx={{ marginTop: "24px" }}>
            <CopyLinkToClipboard link={window.location.href} scrollId={entityName}>
              <Typography variant="h4" id={entityName}>
                {entityName}
              </Typography>
            </CopyLinkToClipboard>
          </Box>
          <div>
            <div style={{ display: "block", paddingLeft: "5px", textAlign: "left", color: "white" }} className="Hover-Underline MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium MuiButtonBase-root  css-1huqmjz-MuiButtonBase-root-MuiButton-root" onClick={() => downloadCSV(mappedCurrentEntityData, entityName, entityName)} >Download All Snapshots as csv</div>
            <div style={{ display: "block", paddingLeft: "5px", textAlign: "left", color: "white" }} className="Hover-Underline MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium MuiButtonBase-root  css-1huqmjz-MuiButtonBase-root-MuiButton-root" onClick={() => triggerDownloadAllCharts(true)} >Download All Chart Images</div>
          </div>
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
                issues.filter((x) => x.fieldName === label && x.type === "SUM")?.length === 0 &&
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
              if (dataFieldMetrics[field].revSumMismatch && dataFieldMetrics[field].revSumMismatch.divergence > 5) {
                // if total revenue != protocol + supply revenue, add a warning
                const fieldSplit = field.split("TotalRevenueUSD");
                issues.push({
                  type: "TOTAL_REV",
                  message: JSON.stringify(dataFieldMetrics[`${fieldSplit[0]}TotalRevenueUSD`].revSumMismatch),
                  level: "warning",
                  fieldName: label,
                });
              }
              if (dataFieldMetrics[field].txSumMismatch && dataFieldMetrics[field].txSumMismatch.divergence > 5) {
                // if total transactions != sum of all individual transactions, add a warning
                issues.push({
                  type: "TOTAL_TX",
                  message: JSON.stringify(dataFieldMetrics[field].txSumMismatch),
                  level: "warning",
                  fieldName: label,
                });
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
            let dataChartToPass: any = dataFields[field];
            if (overlayDataFields[field]) {
              dataChartToPass = { current: dataFields[field], overlay: overlayDataFields[field] };
            }
            return (
              <ChartContainer elementId={elementId} downloadAllCharts={downloadAllCharts} identifier={protocolTableData?.slug} datasetLabel={label} dataTable={dataFields[field]} dataChart={dataChartToPass} />
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
  } else if (currentTimeseriesLoading || (!currentTimeseriesLoading && !currentEntityData && !currentTimeseriesError)) {
    return (
      <Grid key={entityName}>
        <Box my={3}>
          <CopyLinkToClipboard link={window.location.href} scrollId={entityName}>
            <Typography variant="h4" id={entityName}>
              {entityName}
            </Typography>
          </CopyLinkToClipboard>
        </Box>
        <CircularProgress sx={{ margin: 6 }} size={50} />
      </Grid>
    );
  } else {
    console.log(
      currentTimeseriesLoading,
      currentTimeseriesLoading,
      currentEntityData,
      currentTimeseriesError,
      protocolTableData,
    );
    return (
      <Grid key={entityName}>
        <Box my={3}>
          <CopyLinkToClipboard link={window.location.href} scrollId={entityName}>
            <Typography variant="h4" id={entityName}>
              {entityName}
            </Typography>
          </CopyLinkToClipboard>
        </Box>
        <h3>Hold on! This subgraph has alot of entities, it may take a minute for the query to return.</h3>
        <CircularProgress sx={{ margin: 6 }} size={50} />
      </Grid>
    );
  }
}

export default ProtocolTabEntity;
