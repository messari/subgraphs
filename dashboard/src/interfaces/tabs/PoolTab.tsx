import { Box, CircularProgress, Grid, Typography } from "@mui/material";
import { PoolDropDown } from "../../common/utilComponents/PoolDropDown";
import { dateValueKeys, PoolName, PoolNames } from "../../constants";
import SchemaTable from "../SchemaTable";
import IssuesDisplay from "../IssuesDisplay";
import { useEffect, useState } from "react";
import { CopyLinkToClipboard } from "../../common/utilComponents/CopyLinkToClipboard";
import PoolTabEntity from "./PoolTabEntity";
import BridgeOutboundVolumeLogic from "../../common/utilComponents/BridgeOutboundVolumeLogic";

interface PoolTabProps {
  data: any;
  overlayData: any;
  entitiesData: { [x: string]: { [x: string]: string } };
  subgraphToQueryURL: string;
  protocolData: { [x: string]: any };
  poolTimeseriesData: any;
  poolTimeseriesError: any;
  poolTimeseriesLoading: any;
  overlayPoolTimeseriesData: any;
  overlayPoolTimeseriesLoading: boolean;
  poolId: string;
  poolData: { [x: string]: string };
  poolsList: { [x: string]: any[] };
  poolListLoading: any;
  poolNames: string;
  poolsListError: any;
  setPoolId: React.Dispatch<React.SetStateAction<string>>;
}

function PoolTab({
  data,
  overlayData,
  entitiesData,
  subgraphToQueryURL,
  protocolData,
  poolTimeseriesData,
  poolTimeseriesError,
  poolTimeseriesLoading,
  overlayPoolTimeseriesData,
  overlayPoolTimeseriesLoading,
  poolId,
  poolData,
  poolsList,
  poolNames,
  poolListLoading,
  poolsListError,
  setPoolId,
}: PoolTabProps) {
  const [issuesToDisplay, setIssuesToDisplay] = useState<{
    [key: string]: { message: string; type: string; level: string; fieldName: string };
  }>({});

  console.log("DATA", data);
  // Get the key name of the pool specific to the protocol type (singular and plural)
  const poolKeySingular = PoolName[data.protocols[0].type];
  const poolKeyPlural = PoolNames[data.protocols[0].type];

  let allLoaded = false;
  if (!poolTimeseriesLoading && (poolTimeseriesData || poolTimeseriesError)) {
    allLoaded = true;
  }

  let oneLoaded = false;
  Object.keys(poolTimeseriesLoading).forEach((entity: string) => {
    if (poolTimeseriesData[entity]) {
      oneLoaded = true;
    }
  });

  let issuesDisplayElement = null;
  const entityData = data[poolKeySingular];

  let poolDropDown = null;
  if (poolsList) {
    poolDropDown = (
      <PoolDropDown
        poolId={poolId}
        setPoolId={(x) => {
          setIssuesToDisplay({});
          setPoolId(x);
        }}
        pools={poolsList[poolNames]}
      />
    );
  } else if (poolListLoading || !poolId) {
    poolDropDown = <CircularProgress sx={{ margin: 6 }} size={50} />;
  }

  // Specific chart routing
  // This logic renders components that are specific to a given schema type or version
  const specificCharts: any[] = [];
  const specificChartsOnEntity: any = {};

  // structure entityName > { chartName: chartElement}
  const schemaType = data?.protocols[0]?.type;
  const schemaVersion = data?.protocols[0]?.version;

  if (schemaType?.toUpperCase() === "BRIDGE") {
    const headerComponent = (
      <Grid key={"Bridge Specific Charts"}>
        <Box sx={{ marginTop: "24px" }}>
          <CopyLinkToClipboard link={window.location.href} scrollId={"Bridge Specific Charts"}>
            <Typography variant="h4">{"Bridge Specific Charts"}</Typography>
          </CopyLinkToClipboard>
        </Box>
      </Grid>
    );
    if (data[poolKeySingular]?.routes?.length > 0) {
      specificCharts.push(
        headerComponent,
        <BridgeOutboundVolumeLogic
          poolId={poolId}
          routes={data[poolKeySingular]?.routes}
          subgraphToQueryURL={subgraphToQueryURL}
        />,
      );
    }
  } else if (schemaType?.toUpperCase() === "EXCHANGE") {
    if (poolTimeseriesData) {
      Object.keys(poolTimeseriesData).forEach((entityName: string) => {
        if (!specificChartsOnEntity[entityName]) {
          specificChartsOnEntity[entityName] = {};
        }
        const currentEntityData = poolTimeseriesData[entityName];
        const tokenWeightData: any = [];
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
          if (timeseriesInstance.inputTokenWeights) {
            timeseriesInstance.inputTokenWeights.forEach((weight: any, idx: number) => {
              if (idx > tokenWeightData.length - 1) {
                tokenWeightData.push([]);
              }
              tokenWeightData[idx].push({ value: Number(weight), date: dateVal });
            });
          }
          // For exchange protocols, calculate the baseYield
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
          if (!specificChartsOnEntity[entityName]["baseYield"]) {
            specificChartsOnEntity[entityName]["baseYield"] = [];
          } else {
            specificChartsOnEntity[entityName]["baseYield"].push({ value, date: dateVal });
          }
        }
        specificChartsOnEntity[entityName]["inputTokenWeights"] = tokenWeightData;
      });
    }
  } else if (schemaType?.toUpperCase() === "YIELD") {
    if (poolTimeseriesData) {
      Object.keys(poolTimeseriesData).forEach((entityName: string) => {
        if (!specificChartsOnEntity[entityName]) {
          specificChartsOnEntity[entityName] = {};
        }
        const currentEntityData = poolTimeseriesData[entityName];
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
          let value = 0;
          // For Yield Agg protocols, calculate the baseYield
          if (timeseriesInstance.totalValueLockedUSD && timeseriesInstance.dailySupplySideRevenueUSD) {
            value =
              Number(timeseriesInstance.dailySupplySideRevenueUSD / Number(timeseriesInstance.totalValueLockedUSD)) *
              365 *
              100;
          } else if (timeseriesInstance.totalValueLockedUSD && timeseriesInstance.hourlySupplySideRevenueUSD) {
            value =
              Number(timeseriesInstance.hourlySupplySideRevenueUSD / Number(timeseriesInstance.totalValueLockedUSD)) *
              365 *
              100;
          }
          if (!specificChartsOnEntity[entityName]["baseYield"]) {
            specificChartsOnEntity[entityName]["baseYield"] = [];
          } else {
            specificChartsOnEntity[entityName]["baseYield"].push({ value, date: dateVal });
          }
        }
      });
    }
  } else if (schemaType?.toUpperCase() === "LENDING") {
    if (poolTimeseriesData) {
      Object.keys(poolTimeseriesData).forEach((entityName: string) => {
        if (!specificChartsOnEntity[entityName]) {
          specificChartsOnEntity[entityName] = {};
        }
        const currentEntityData = poolTimeseriesData[entityName];
        const tableVals: { value: any; date: any }[] = [];
        const ratesChart: any = {};
        const ratesSums: any = {};
        data?.market?.rates?.forEach((rate: { [x: string]: string }) => {
          const rateKey = `${rate?.type || ""}-${rate?.side || ""}`;
          ratesChart[rateKey] = [];
          ratesSums[rateKey] = 0;
        });
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
          const initTableValue: any = { value: [], date: dateVal };
          timeseriesInstance["rates"].forEach((rateElement: any, idx: number) => {
            const rateKey = `${rateElement.type || ""}-${rateElement.side || ""}`;
            initTableValue.value.push(`[${idx}]: ${Number(rateElement.rate).toFixed(3)}%`);
            ratesSums[rateKey] += Number(rateElement.rate);
            ratesChart[rateKey].push({ value: Number(rateElement.rate), date: dateVal });
          });
          tableVals.push({ value: initTableValue.value.join(", "), date: initTableValue.date });
        }
        const issues = Object.keys(ratesSums)?.filter((rateLabel) => ratesSums[rateLabel] === 0);
        specificChartsOnEntity[entityName]["rates"] = {
          dataChart: ratesChart,
          tableData: tableVals,
          issues: issues.map((iss) => entityName + "-" + iss),
        };
      });
    }
  }

  let poolDataSection = null;
  let poolTable = null;
  if (poolId) {
    const issuesArrayProps: { message: string; type: string; level: string; fieldName: string }[] =
      Object.values(issuesToDisplay);
    issuesDisplayElement = (
      <IssuesDisplay issuesArrayProps={issuesArrayProps} allLoaded={allLoaded} oneLoaded={oneLoaded} />
    );
    if (poolData) {
      poolTable = (
        <SchemaTable
          key="SchemaTable"
          entityData={entityData}
          schemaName={poolKeySingular}
          protocolType={data.protocols[0].type}
          dataFields={poolData}
          setIssues={(issArr: any) => {
            const issuesToAdd: any = {};
            issArr.forEach((issObj: any) => {
              issuesToAdd[issObj.fieldName + issObj.type] = issObj;
            });
            if (Object.keys(issuesToAdd).length > 0) {
              setIssuesToDisplay((prevState) => {
                return { ...prevState, ...issuesToAdd };
              });
            }
          }}
        />
      );
    }
    let activeMessage = null;
    if (data.protocols[0].type === "LENDING") {
      activeMessage = (
        <Typography sx={{ color: "lime", my: 3 }} variant="h5">
          This Market is active.
        </Typography>
      );
      if (!entityData?.isActive) {
        activeMessage = (
          <Typography sx={{ color: "red", my: 3 }} variant="h5">
            This Market is <b>NOT</b> active.
          </Typography>
        );
      }
    }
    if (poolTimeseriesData) {
      const poolEntityElements = Object.keys(poolTimeseriesData).map((entityName: string) => {
        let entitySpecificElements: any = {};
        if (specificChartsOnEntity[entityName]) {
          entitySpecificElements = specificChartsOnEntity[entityName];
        }
        return (
          <PoolTabEntity
            key={"poolTabEntity-" + entityName}
            data={data}
            overlayData={overlayData}
            currentEntityData={poolTimeseriesData[entityName]}
            entitySpecificElements={entitySpecificElements}
            overlayPoolTimeseriesData={overlayPoolTimeseriesData[entityName]}
            overlayPoolTimeseriesLoading={overlayPoolTimeseriesLoading}
            entityName={entityName}
            entitiesData={entitiesData}
            poolId={poolId}
            protocolData={protocolData}
            setIssues={(issArr: any) => {
              const issuesToAdd: any = {};
              issArr.forEach((issObj: any) => {
                issuesToAdd[issObj.fieldName + issObj.type] = issObj;
              });
              if (Object.keys(issuesToAdd).length > 0) {
                setIssuesToDisplay((prevState) => {
                  return { ...prevState, ...issuesToAdd };
                });
              }
            }}
          />
        );
      });
      poolDataSection = (
        <div>
          {poolTable}
          {activeMessage}
          {poolEntityElements}
        </div>
      );
    } else if (!poolTimeseriesData && !poolTimeseriesError) {
      poolDataSection = (
        <div>
          {poolTable}
          <CircularProgress sx={{ margin: 6 }} size={50} />
        </div>
      );
    } else if (poolTimeseriesError) {
      poolDataSection = (
        <Grid key={"poolTabEntityError"}>
          <h3>Query Could not Return Successfully - {poolTimeseriesError?.message}</h3>
        </Grid>
      );
    } else {
      poolDataSection = (
        <div>
          {poolTable}
          <Grid>
            <Box my={3}>
              <CopyLinkToClipboard link={window.location.href}>
                <Typography variant="h4">
                  Hold on! This subgraph has alot of entities, it may take a minute for the query to return. Try
                  reloading.
                </Typography>
              </CopyLinkToClipboard>
            </Box>
            <CircularProgress sx={{ margin: 6 }} size={50} />
          </Grid>
        </div>
      );
    }
  }

  return (
    <>
      {issuesDisplayElement}
      {poolDropDown}
      {poolDataSection}
      {specificCharts}
    </>
  );
}

export default PoolTab;
