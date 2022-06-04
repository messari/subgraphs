import { Box, CircularProgress, Grid, Typography } from "@mui/material";
import { Chart } from "../../common/chartComponents/Chart";
import { TableChart } from "../../common/chartComponents/TableChart";
import { PoolDropDown } from "../../common/utilComponents/PoolDropDown";
import { negativeFieldList, PoolName, PoolNames } from "../../constants";
import SchemaTable from "../SchemaTable";
import { convertTokenDecimals } from "../../utils";
import { StackedChart } from "../../common/chartComponents/StackedChart";
import IssuesDisplay from "../IssuesDisplay";
import { useEffect, useState } from "react";
import { CopyLinkToClipboard } from "../../common/utilComponents/CopyLinkToClipboard";
import PoolTabEntity from "./PoolTabEntity";

interface PoolTabProps {
  data: any;
  poolTimeseriesData: any;
  poolTimeseriesError: any;
  poolTimeseriesLoading: any;
  entitiesData: { [x: string]: { [x: string]: string } };
  poolId: string;
  setPoolId: React.Dispatch<React.SetStateAction<string>>;
  protocolData: { [x: string]: any };
  poolData: { [x: string]: string };
  poolsList: { [x: string]: any[] };
  poolListLoading: any;
  poolNames: string;
  poolsListError: any;
}

function PoolTab({
  data,
  poolTimeseriesData,
  poolTimeseriesError,
  poolTimeseriesLoading,
  entitiesData,
  poolId,
  setPoolId,
  poolData,
  protocolData,
  poolsList,
  poolNames,
  poolListLoading,
  poolsListError,
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

  let allLoaded = true;
  Object.keys(poolTimeseriesLoading).forEach((loading: string) => {
    if (poolTimeseriesLoading[loading]) {
      allLoaded = false;
    }
  });

  let oneLoaded = false;
  Object.keys(poolTimeseriesLoading).forEach((loading: string) => {
    if (!poolTimeseriesLoading[loading] && poolTimeseriesData[loading]) {
      oneLoaded = true;
    }
  });

  useEffect(() => {
    console.log("PROTOCOL ISSUES TO SET", issuesToDisplay, issues, tableIssues);
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
        markets={poolsList[poolNames]}
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
  if (poolId) {
    issuesDisplayElement = (
      <IssuesDisplay issuesArrayProps={issuesToDisplay} allLoaded={allLoaded} oneLoaded={oneLoaded} />
    );
    if (poolTimeseriesData) {
      const poolEntityElements = Object.keys(poolTimeseriesData).map((entityName: string) => {
        return (
          <PoolTabEntity
            data={data}
            currentEntityData={poolTimeseriesData[entityName]}
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
          <SchemaTable
            entityData={entityData}
            schemaName={poolKeySingular}
            dataFields={poolData}
            setIssues={(x) => setTableIssues(x)}
            issuesProps={tableIssues}
          />
          {poolEntityElements}
        </div>
      );
    } else if (!poolTimeseriesData && !poolTimeseriesError) {
      poolDataSection = (
        <div>
          <SchemaTable
            entityData={entityData}
            schemaName={poolKeySingular}
            dataFields={poolData}
            setIssues={(x) => setTableIssues(x)}
            issuesProps={tableIssues}
          />
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
          <SchemaTable
            entityData={entityData}
            schemaName={poolKeySingular}
            dataFields={poolData}
            setIssues={(x) => setTableIssues(x)}
            issuesProps={tableIssues}
          />
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
