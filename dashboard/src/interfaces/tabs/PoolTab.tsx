import { Box, CircularProgress, Grid, Typography } from "@mui/material";
import { PoolDropDown } from "../../common/utilComponents/PoolDropDown";
import { PoolName, PoolNames } from "../../constants";
import SchemaTable from "../SchemaTable";
import IssuesDisplay from "../IssuesDisplay";
import { useEffect, useState } from "react";
import { CopyLinkToClipboard } from "../../common/utilComponents/CopyLinkToClipboard";
import PoolTabEntity from "./PoolTabEntity";
import BridgeOutboundVolumeLogic from "../BridgeOutboundVolumeLogic";

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
  const [issuesToDisplay, setIssuesToDisplay] = useState<
    { message: string; type: string; level: string; fieldName: string }[]
  >([]);
  const [tableIssues, setTableIssues] = useState<{ message: string; type: string; level: string; fieldName: string }[]>(
    [],
  );
  const issues: { [entityName: string]: { message: string; type: string; level: string; fieldName: string }[] } = {};
  function setIssues(
    issuesSet: { [x: string]: { message: string; type: string; level: string; fieldName: string }[] },
    entityName: string,
  ) {
    issues[entityName] = issuesSet[entityName];
  }

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

  useEffect(() => {
    console.log("POOL ISSUES TO SET", issuesToDisplay, issues, tableIssues);
    let brokenDownIssuesState: { message: string; type: string; level: string; fieldName: string }[] = tableIssues;
    Object.keys(issues).forEach((iss) => {
      brokenDownIssuesState = brokenDownIssuesState.concat(issues[iss]);
    });
    if (allLoaded) {
      setIssuesToDisplay(brokenDownIssuesState);
    }
  }, [poolTimeseriesData, poolTimeseriesLoading, tableIssues]);

  let issuesDisplayElement = null;

  const entityData = data[poolKeySingular];

  let poolDropDown = null;
  if (poolsList) {
    poolDropDown = (
      <PoolDropDown
        poolId={poolId}
        setPoolId={(x) => setPoolId(x)}
        setIssues={(x) => {
          setTableIssues(x);
        }}
        pools={poolsList[poolNames]}
      />
    );
  } else if (poolListLoading) {
    poolDropDown = <CircularProgress sx={{ margin: 6 }} size={50} />;
  } else if (!poolId) {
    poolDropDown = (
      <h3>
        Hold on! This subgraph has alot of entities, it may take a minute for the query to return. After 2 minutes of
        waiting, refresh the page and the results should appear promptly.
      </h3>
    );
  }


  // Specific chart routing
  // This logic renders components that are specific to a given schema type or version
  const specificCharts: any[] = [];
  const specificChartsOnEntity: any = {};

  // structure entityName > { chartName: chartElement}
  const schemaType = data?.protocols[0]?.type;
  const schemaVersion = data?.protocols[0]?.version;

  if (schemaType?.toUpperCase() === "BRIDGE") {
    const headerComponent = (<Grid key={"Bridge Specific Charts"}>
      <Box sx={{ marginTop: "24px" }}>
        <CopyLinkToClipboard link={window.location.href} scrollId={"Bridge Specific Charts"}>
          <Typography variant="h4">{"Bridge Specific Charts"}</Typography>
        </CopyLinkToClipboard>
      </Box>
    </Grid>);
    specificCharts.push(headerComponent, <BridgeOutboundVolumeLogic poolId={poolId} routes={data[poolKeySingular]?.routes} subgraphToQueryURL={subgraphToQueryURL} />);
  } else if (schemaType?.toUpperCase() === "EXCHANGE") {
    if (poolTimeseriesData) {
      Object.keys(poolTimeseriesData).forEach((entityName: string) => {
        if (!specificChartsOnEntity[entityName]) {
          specificChartsOnEntity[entityName] = {};
        }
        const currentEntityData = poolTimeseriesData[entityName];
        const tokenWeightData: any = []
        for (let x = currentEntityData.length - 1; x >= 0; x--) {
          const timeseriesInstance: { [x: string]: any } = currentEntityData[x];
          if (timeseriesInstance.inputTokenWeights) {
            timeseriesInstance.inputTokenWeights.forEach((weight: any, idx: number) => {
              if (idx > tokenWeightData.length - 1) {
                tokenWeightData.push([]);
              }
              tokenWeightData[idx].push({ value: Number(weight), date: Number(timeseriesInstance.timestamp) })
            })
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
          if (!specificChartsOnEntity[entityName]['baseYield']) {
            specificChartsOnEntity[entityName]['baseYield'] = [];
          } else {
            specificChartsOnEntity[entityName]['baseYield'].push({ value, date: Number(timeseriesInstance.timestamp) });
          }
        }
        specificChartsOnEntity[entityName]['inputTokenWeights'] = tokenWeightData;
      })
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
          let value = 0;
          // For Yield Agg protocols, calculate the baseYield
          if (timeseriesInstance.totalValueLockedUSD && timeseriesInstance.dailySupplySideRevenueUSD) {
            value = Number(timeseriesInstance.dailySupplySideRevenueUSD / Number(timeseriesInstance.totalValueLockedUSD)) * 365 * 100;
          } else if (timeseriesInstance.totalValueLockedUSD && timeseriesInstance.hourlySupplySideRevenueUSD) {
            value = Number(timeseriesInstance.hourlySupplySideRevenueUSD / Number(timeseriesInstance.totalValueLockedUSD)) * 365 * 100;
          }
          if (!specificChartsOnEntity[entityName]['baseYield']) {
            specificChartsOnEntity[entityName]['baseYield'] = [];
          } else {
            specificChartsOnEntity[entityName]['baseYield'].push({ value, date: Number(timeseriesInstance.timestamp) });
          }
        }
      })
    }
  }

  let poolDataSection = null;
  let poolTable = null;
  if (poolId) {
    issuesDisplayElement = (
      <IssuesDisplay issuesArrayProps={issuesToDisplay} allLoaded={allLoaded} oneLoaded={oneLoaded} />
    );
    if (poolData) {
      poolTable = (
        <SchemaTable
          key="SchemaTable"
          entityData={entityData}
          schemaName={poolKeySingular}
          protocolType={data.protocols[0].type}
          dataFields={poolData}
          setIssues={(x) => setTableIssues(x)}
          issuesProps={tableIssues}
        />
      );
    }
    let activeMessage = null
    if (data.protocols[0].type === "LENDING") {
      activeMessage = <Typography sx={{ color: "lime", my: 3 }} variant="h5">This Market is active.</Typography>;
      if (!entityData?.isActive) {
        activeMessage = <Typography sx={{ color: "red", my: 3 }} variant="h5">This Market is <b>NOT</b> active.</Typography>;
      }
    }
    if (poolTimeseriesData) {
      const poolEntityElements = Object.keys(poolTimeseriesData).map((entityName: string) => {
        let entitySpecificElements: any = {};
        if (specificChartsOnEntity[entityName]) {
          entitySpecificElements = (specificChartsOnEntity[entityName]);
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
            issuesProps={issues}
            setIssues={(x) => setIssues(x, entityName)}
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
        <Grid>
          <Box my={3}>
            <CopyLinkToClipboard link={window.location.href}>
              <Typography variant="h4">{poolTimeseriesError?.message}</Typography>
            </CopyLinkToClipboard>
          </Box>
          <CircularProgress sx={{ margin: 6 }} size={50} />
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
