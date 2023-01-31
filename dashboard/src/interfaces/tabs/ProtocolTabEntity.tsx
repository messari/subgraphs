import { Box, CircularProgress, Grid, Tooltip, Typography } from "@mui/material";
import { dateValueKeys, negativeFieldList } from "../../constants";
import { base64toBlobJPEG, convertTokenDecimals, downloadCSV } from "../../utils";
import { useEffect, useState } from "react";
import { CopyLinkToClipboard } from "../../common/utilComponents/CopyLinkToClipboard";
import { BigNumber } from "bignumber.js";
import { ChartContainer } from "../../common/chartComponents/ChartContainer";
import moment from "moment";
import JSZip from "jszip";
import DefiLlamaComparsionTab from "../DefiLlamaComparisonTab";
import { UploadFileCSV } from "../../common/utilComponents/UploadFileCSV";

interface ProtocolTabEntityProps {
  entitiesData: { [x: string]: { [x: string]: string } };
  entityName: string;
  protocolType: string;
  subgraphEndpoints: any;
  entitySpecificElements: any;
  protocolTableData: { [x: string]: any };
  overlaySchemaData: any;
  protocolSchemaData: any;
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
  subgraphEndpoints,
  entitySpecificElements,
  protocolTableData,
  overlaySchemaData,
  protocolSchemaData,
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
  const [chartsImageFiles, setChartsImageFiles] = useState<any>({});
  const [defiLlamaCompareTVL, setDefiLlamaCompareTVL] = useState<boolean>(false);
  const [csvJSON, setCsvJSON] = useState<any>(null);
  const [csvMetaData, setCsvMetaData] = useState<any>({ fileName: "", columnName: "", csvError: null });

  useEffect(() => {
    if (downloadAllCharts) {
      if (chartsImageFiles) {
        if (Object.keys(chartsImageFiles).length > 0) {
          let zip = new JSZip();
          Object.keys(chartsImageFiles).forEach(fileName => {
            const blob = base64toBlobJPEG(chartsImageFiles[fileName]);
            if (blob) {
              zip.file(fileName + '.jpeg', blob);
            }
          });
          zip.generateAsync({ type: "base64" }).then(function (content) {
            const link = document.createElement('a');
            link.download = "charts.zip";
            link.href = "data:application/zip;base64," + content;
            link.click()
            triggerDownloadAllCharts(false);
          });
        }
      }
    }
  }, [chartsImageFiles])

  useEffect(() => {
    const issuesToSet = { ...issuesProps };
    issuesToSet[entityName] = issues;
    setIssues(issuesToSet);
  });

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
        let dateVal: number = Number(timeseriesInstance['timestamp']);
        dateValueKeys.forEach((key: string) => {
          let factor = 86400;
          if (key.includes('hour')) {
            factor = factor / 24;
          }
          if (!!(Number(timeseriesInstance[key]) * factor)) {
            dateVal = (Number(timeseriesInstance[key]) * factor);
          }
        })

        let overlayIndex = x;
        if (overlayDifference > 0) {
          overlayIndex = x - overlayDifference;
        }
        const overlayTimeseriesInstance: { [x: string]: any } = currentOverlayEntityData[overlayIndex];

        let overlayDateVal: number = Number(overlayTimeseriesInstance?.['timestamp']) || 0;
        if (!!overlayTimeseriesInstance) {
          dateValueKeys.forEach((key: string) => {
            let factor = 86400;
            if (key.includes('hour')) {
              factor = factor / 24;
            }
            if (!!(Number(overlayTimeseriesInstance[key]) * factor)) {
              overlayDateVal = (Number(overlayTimeseriesInstance[key]) * factor);
            }
          })
        }
        // On the entity instance, loop through all of the entity fields within it
        // create the base yield field for DEXs
        Object.keys(timeseriesInstance).forEach((fieldName: string) => {
          // skip the timestamp field on each entity instance
          if (fieldName === "timestamp" || fieldName === "id" || fieldName === "__typename" || dateValueKeys.includes(fieldName)) {
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
                  { value: Number(currentInstanceField), date: dateVal },
                ];
                dataFieldMetrics[fieldName] = { sum: Number(currentInstanceField) };
              } else {
                dataFields[fieldName].push({
                  value: Number(currentInstanceField),
                  date: dateVal,
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
              if (fieldName?.toUpperCase()?.includes("CUMULATIVE")) {
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
                  dataFields[dataFieldKey] = [{ value: value, date: dateVal }];
                  dataFieldMetrics[dataFieldKey] = { sum: value };
                } else {
                  dataFields[dataFieldKey].push({ value: value, date: dateVal });
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
                if (dataFieldKey?.toUpperCase()?.includes("CUMULATIVE")) {
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
                    { value: Number(currentOverlayInstanceField), date: overlayDateVal },
                  ];
                } else {
                  overlayDataFields[fieldName].push({
                    value: Number(currentOverlayInstanceField),
                    date: overlayDateVal,
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
                    overlayDataFields[dataFieldKey] = [{ value: value, date: overlayDateVal }];
                  } else {
                    overlayDataFields[dataFieldKey].push({ value: value, date: overlayDateVal });
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
        let dateVal: number = Number(instance['timestamp']);
        dateValueKeys.forEach((key: string) => {
          let factor = 86400;
          if (key.includes('hour')) {
            factor = factor / 24;
          }
          if (!!(Number(instance[key]) * factor)) {
            dateVal = (Number(instance[key]) * factor);
          }
        })
        instanceToSave.date = moment.utc(dateVal).format("YYYY-MM-DD");
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
          <Tooltip placement="top" title={"Overlay chart with data points populated from a .csv file"}>
            <UploadFileCSV style={{ paddingLeft: "5px", color: "lime" }} isEntityLevel={true} csvMetaData={csvMetaData} field={entityName} csvJSON={csvJSON} setCsvJSON={setCsvJSON} setCsvMetaData={setCsvMetaData} />
          </Tooltip>
          <div>
            <div style={{ display: "block", paddingLeft: "5px", textAlign: "left", color: "white" }} className="Hover-Underline MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium MuiButtonBase-root  css-1huqmjz-MuiButtonBase-root-MuiButton-root" onClick={() => downloadCSV(mappedCurrentEntityData, entityName, entityName)} >Download Snapshots as csv</div>
            <div style={{ display: "block", paddingLeft: "5px", textAlign: "left", color: "white" }} className="Hover-Underline MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium MuiButtonBase-root  css-1huqmjz-MuiButtonBase-root-MuiButton-root" onClick={() => triggerDownloadAllCharts(true)} >Download All Chart Images</div>
          </div>
          {Object.keys(dataFields).map((field: string) => {
            // The following checks if the field is required or can be null
            const fieldName = field.split(" [")[0];
            if (fieldName === "totalValueLockedUSD" && defiLlamaCompareTVL && entityName === "financialsDailySnapshots") {
              return <>
                <div style={{ display: "block", paddingLeft: "5px", textAlign: "left", color: "white" }} className="Hover-Underline MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium MuiButtonBase-root  css-1huqmjz-MuiButtonBase-root-MuiButton-root" onClick={() => setDefiLlamaCompareTVL(false)} >Remove DefiLlama Comparison</div>
                <DefiLlamaComparsionTab subgraphEndpoints={subgraphEndpoints} financialsData={{ financialsDailySnapshots: currentEntityData }} /></>;
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
                  message: 6 + message,
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
            const baseKey = `${protocolSchemaData?.protocols[0]?.name}-${protocolSchemaData?.protocols[0]?.network}-${protocolSchemaData?.protocols[0]?.subgraphVersion}`;
            if (overlayDataFields[field]) {
              const overlayKey = `${overlaySchemaData?.protocols[0]?.name}-${overlaySchemaData?.protocols[0]?.network}-${overlaySchemaData?.protocols[0]?.subgraphVersion}`;
              let keyDiff = "";
              if (baseKey === overlayKey) {
                keyDiff = ' (Overlay)';
              }
              dataChartToPass = { [baseKey]: dataFields[field], [overlayKey + keyDiff]: overlayDataFields[field] };
            }
            let tvlButton = null;
            if (fieldName === "totalValueLockedUSD" && entityName === "financialsDailySnapshots") {
              tvlButton = <div style={{ display: "block", paddingLeft: "5px", textAlign: "left", color: "white" }} className="Hover-Underline MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium MuiButtonBase-root  css-1huqmjz-MuiButtonBase-root-MuiButton-root" onClick={() => setDefiLlamaCompareTVL(true)} >Compare TVL To DefiLlama</div>;
            }
            return (
              <>
                {tvlButton}
                <ChartContainer
                  csvMetaDataProp={csvMetaData}
                  csvJSONProp={csvJSON}
                  baseKey={baseKey}
                  elementId={elementId}
                  downloadAllCharts={downloadAllCharts}
                  identifier={protocolTableData?.slug}
                  datasetLabel={label}
                  dataTable={dataFields[field]}
                  dataChart={dataChartToPass}
                  chartsImageFiles={chartsImageFiles}
                  setChartsImageFiles={(x: any) => setChartsImageFiles(x)}
                  isStringField={false}
                />
              </>
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
  } else if (currentTimeseriesError) {
    issues.push({
      type: "VAL",
      message: currentTimeseriesError?.message,
      level: "critical",
      fieldName: entityName + "-" + currentTimeseriesError?.message,
    });

    return (
      <Grid key={entityName}>
        <Box my={3}>
          <CopyLinkToClipboard link={window.location.href} scrollId={entityName}>
            <Typography variant="h4" id={entityName}>
              {entityName}
            </Typography>
          </CopyLinkToClipboard>
        </Box>
        <h3>{currentTimeseriesError?.message}</h3>
      </Grid>
    );
  } else {
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