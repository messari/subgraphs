import { Box, CircularProgress, Grid, Typography } from "@mui/material";
import { useState } from "react";
import { Chart } from "../../common/chartComponents/Chart";
import { TableChart } from "../../common/chartComponents/TableChart";
import { negativeFieldList, ProtocolTypeEntityName, ProtocolTypeEntityNames } from "../../constants";
import { convertTokenDecimals, toDate } from "../../utils";
import SchemaTable from "../SchemaTable";
import IssuesDisplay from "../IssuesDisplay";
import { useEffect } from "react";
import { CopyLinkToClipboard } from "../../common/utilComponents/CopyLinkToClipboard";
import ProtocolTabEntity from "./ProtocolTabEntity";

interface ProtocolTabProps {
  protocolType: string;
  entitiesData: { [x: string]: { [x: string]: string } };
  protocolFields: { [x: string]: string };
  protocolTableData: { [x: string]: any };
  protocolTimeseriesData: any;
  protocolTimeseriesLoading: any;
  protocolTimeseriesError: any;
}

// This component is for each individual subgraph
function ProtocolTab({
  protocolType,
  entitiesData,
  protocolFields,
  protocolTableData,
  protocolTimeseriesData,
  protocolTimeseriesLoading,
  protocolTimeseriesError,
}: ProtocolTabProps) {
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
  const list: { [x: string]: any } = {};
  const protocolEntityNamePlural = ProtocolTypeEntityNames[protocolType];
  const protocolEntityNameSingular = ProtocolTypeEntityName[protocolType];
  let protocolDataRender: any[] = [];
  if (protocolTimeseriesData) {
    protocolDataRender = Object.keys(protocolTimeseriesData).map((entityName: string) => {
      const currentEntityData = protocolTimeseriesData[entityName];
      return (
        <ProtocolTabEntity
          entityName={entityName}
          protocolType={protocolType}
          entitiesData={entitiesData}
          currentEntityData={currentEntityData}
          currentTimeseriesLoading={protocolTimeseriesLoading[entityName]}
          currentTimeseriesError={protocolTimeseriesError[entityName]}
          protocolTableData={protocolTableData[protocolEntityNameSingular]}
          issuesProps={issues}
          setIssues={(x) => setIssues(x, entityName)}
        />
      );
    });
  }

  let allLoaded = true;
  Object.keys(protocolTimeseriesLoading).forEach((loading: string) => {
    if (protocolTimeseriesLoading[loading]) {
      allLoaded = false;
    }
  });

  let oneLoaded = false;
  Object.keys(protocolTimeseriesLoading).forEach((loading: string) => {
    if (!protocolTimeseriesLoading[loading] && protocolTimeseriesData[loading]) {
      oneLoaded = true;
    }
  });

  useEffect(() => {
    let brokenDownIssuesState: { message: string; type: string; level: string; fieldName: string }[] = tableIssues;
    Object.keys(issues).forEach((iss) => {
      brokenDownIssuesState = brokenDownIssuesState.concat(issues[iss]);
    });
    if (allLoaded) {
      setIssuesToDisplay(brokenDownIssuesState);
    }
  }, [protocolTimeseriesData, protocolTimeseriesLoading, tableIssues]);

  if (!protocolTableData) {
    return <CircularProgress sx={{ margin: 6 }} size={50} />;
  }

  return (
    <>
      <IssuesDisplay issuesArrayProps={issuesToDisplay} oneLoaded={oneLoaded} allLoaded={allLoaded} />
      <SchemaTable
        entityData={protocolTableData[protocolEntityNameSingular]}
        schemaName={protocolEntityNameSingular}
        dataFields={protocolFields}
        setIssues={(x) => setTableIssues(x)}
        issuesProps={tableIssues}
      />
      {protocolDataRender}
    </>
  );
}

export default ProtocolTab;
