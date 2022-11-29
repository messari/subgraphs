import { Box, CircularProgress, Grid, Typography } from "@mui/material";
import { PoolDropDown } from "../../common/utilComponents/PoolDropDown";
import { PoolName, PoolNames } from "../../constants";
import SchemaTable from "../SchemaTable";
import IssuesDisplay from "../IssuesDisplay";
import { useEffect, useState } from "react";
import { CopyLinkToClipboard } from "../../common/utilComponents/CopyLinkToClipboard";
import PoolTabEntity from "./PoolTabEntity";

interface PoolTabProps {
  data: any;
  overlayData: any;
  entitiesData: { [x: string]: { [x: string]: string } };
  protocolData: { [x: string]: any };
  poolTimeseriesData: any;
  poolTimeseriesError: any;
  poolTimeseriesLoading: any;
  overlayPoolTimeseriesData: any;
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
  protocolData,
  poolTimeseriesData,
  poolTimeseriesError,
  poolTimeseriesLoading,
  overlayPoolTimeseriesData,
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
        return (
          <PoolTabEntity
            key={"poolTabEntity-" + entityName}
            data={data}
            overlayData={overlayData}
            currentEntityData={poolTimeseriesData[entityName]}
            overlayPoolTimeseriesData={overlayPoolTimeseriesData[entityName]}
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
    </>
  );
}

export default PoolTab;
