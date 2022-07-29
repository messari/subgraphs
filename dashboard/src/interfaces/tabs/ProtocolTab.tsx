import { CircularProgress } from "@mui/material";
import { useState } from "react";
import { ProtocolTypeEntityName } from "../../constants";
import SchemaTable from "../SchemaTable";
import IssuesDisplay from "../IssuesDisplay";
import { useEffect } from "react";
import ProtocolTabEntity from "./ProtocolTabEntity";

interface ProtocolTabProps {
  entitiesData: { [x: string]: { [x: string]: string } };
  protocolType: string;
  protocolFields: { [x: string]: string };
  protocolTableData: { [x: string]: any };
  protocolTimeseriesData: any;
  protocolTimeseriesLoading: any;
  protocolTimeseriesError: any;
}

// This component is for each individual subgraph
function ProtocolTab({
  entitiesData,
  protocolType,
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

  const protocolEntityNameSingular = ProtocolTypeEntityName[protocolType];
  let protocolDataRender: any[] = [];

  if (protocolTimeseriesData) {
    protocolDataRender = Object.keys(protocolTimeseriesData).map((entityName: string) => {
      const currentEntityData = protocolTimeseriesData[entityName];
      if (!currentEntityData) return null;

      return (
        <ProtocolTabEntity
          entityName={entityName}
          entitiesData={entitiesData}
          currentEntityData={currentEntityData}
          currentTimeseriesLoading={protocolTimeseriesLoading[entityName]}
          currentTimeseriesError={protocolTimeseriesError[entityName]}
          protocolType={protocolType}
          protocolTableData={protocolTableData[protocolEntityNameSingular]}
          issuesProps={issues}
          setIssues={(x) => setIssues(x, entityName)}
        />
      );
    });
  }

  let allLoaded = true;
  Object.keys(protocolTimeseriesLoading).forEach((entity: string) => {
    if (protocolTimeseriesLoading[entity]) {
      allLoaded = false;
    }
  });

  let oneLoaded = false;
  Object.keys(protocolTimeseriesLoading).forEach((entity: string) => {
    if (!protocolTimeseriesLoading[entity] && protocolTimeseriesData[entity]) {
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

  const tableIssuesInit = tableIssues;
  if (
    tableIssues.filter((x) => x.fieldName === `${protocolEntityNameSingular}-totalValueLockedUSD` && x.type === "TVL-")
      .length === 0 &&
    Number(protocolTableData[protocolEntityNameSingular].totalValueLockedUSD) < 1000
  ) {
    tableIssuesInit.push({
      type: "TVL-",
      message: "",
      level: "critical",
      fieldName: `${protocolEntityNameSingular}-totalValueLockedUSD`,
    });
  }
  return (
    <>
      <IssuesDisplay issuesArrayProps={issuesToDisplay} oneLoaded={oneLoaded} allLoaded={allLoaded} />
      <SchemaTable
        entityData={protocolTableData[protocolEntityNameSingular]}
        dataFields={protocolFields}
        schemaName={protocolEntityNameSingular}
        issuesProps={tableIssuesInit}
        setIssues={(x) => setTableIssues(x)}
      />
      {protocolDataRender}
    </>
  );
}

export default ProtocolTab;
