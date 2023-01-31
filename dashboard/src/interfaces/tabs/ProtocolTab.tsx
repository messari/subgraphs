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
  subgraphEndpoints: any;
  protocolTableData: { [x: string]: any };
  overlaySchemaData: any;
  protocolSchemaData: any;
  protocolTimeseriesData: any;
  protocolTimeseriesLoading: any;
  protocolTimeseriesError: any;
  overlayProtocolTimeseriesData: any;
}

// This component is for each individual subgraph
function ProtocolTab({
  entitiesData,
  protocolType,
  protocolFields,
  subgraphEndpoints,
  protocolTableData,
  overlaySchemaData,
  protocolSchemaData,
  protocolTimeseriesData,
  protocolTimeseriesLoading,
  protocolTimeseriesError,
  overlayProtocolTimeseriesData
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

  const specificCharts: any[] = [];
  const specificChartsOnEntity: any = {};

  if (protocolTimeseriesData) {
    protocolDataRender = Object.keys(protocolTimeseriesData).map((entityName: string) => {
      const currentEntityData = protocolTimeseriesData[entityName];
      if (!specificChartsOnEntity[entityName]) {
        specificChartsOnEntity[entityName] = {};
      }
      // Specific chart routing
      // This logic renders components that are specific to a given schema type or version

      const currentOverlayEntityData = overlayProtocolTimeseriesData[entityName];
      if (!currentEntityData) return null;

      let entitySpecificElements: any = {};
      if (specificChartsOnEntity[entityName]) {
        entitySpecificElements = (specificChartsOnEntity[entityName]);
      }

      return (
        <ProtocolTabEntity
          key={entityName + "-ProtocolTabEntity"}
          entityName={entityName}
          entitiesData={entitiesData}
          subgraphEndpoints={subgraphEndpoints}
          currentEntityData={currentEntityData}
          overlaySchemaData={overlaySchemaData}
          entitySpecificElements={entitySpecificElements}
          protocolSchemaData={protocolSchemaData}
          currentOverlayEntityData={currentOverlayEntityData}
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
    if (allLoaded && brokenDownIssuesState.length !== issuesToDisplay.length) {
      setIssuesToDisplay(brokenDownIssuesState);
    }
  }, [protocolTimeseriesData, protocolTimeseriesLoading, tableIssues]);

  if (!protocolTableData) {
    return <CircularProgress sx={{ margin: 6 }} size={50} />;
  }

  const tableIssuesInit = tableIssues;
  return (
    <>
      <IssuesDisplay issuesArrayProps={issuesToDisplay} oneLoaded={oneLoaded} allLoaded={allLoaded} />
      <SchemaTable
        entityData={protocolTableData[protocolEntityNameSingular]}
        protocolType={protocolType}
        dataFields={protocolFields}
        schemaName={protocolEntityNameSingular}
        issuesProps={tableIssuesInit}
        setIssues={(x) => setTableIssues(x)}
      />
      {protocolDataRender}
      {specificCharts}
    </>
  );
}

export default ProtocolTab;
