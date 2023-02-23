import { Box, CircularProgress, Grid, Typography } from "@mui/material";
import { useState } from "react";
import { ProtocolTypeEntityName } from "../../constants";
import SchemaTable from "../SchemaTable";
import IssuesDisplay from "../IssuesDisplay";
import { useEffect } from "react";
import ProtocolTabEntity from "./ProtocolTabEntity";
import { CopyLinkToClipboard } from "../../common/utilComponents/CopyLinkToClipboard";

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
  const [issuesToDisplay, setIssuesToDisplay] = useState<{
    [key: string]:
    { message: string; type: string; level: string; fieldName: string }
  }>({});

  const protocolEntityNameSingular = ProtocolTypeEntityName[protocolType];
  let protocolDataRender: any[] = [];

  const specificCharts: any[] = [];
  const specificChartsOnEntity: any = {};

  if (protocolTimeseriesData) {
    protocolDataRender = Object.keys(protocolTimeseriesData).map((entityName: string, index: number) => {
      const currentEntityData = protocolTimeseriesData[entityName];
      if (!specificChartsOnEntity[entityName]) {
        specificChartsOnEntity[entityName] = {};
      }
      // Specific chart routing
      // This logic renders components that are specific to a given schema type or version

      const currentOverlayEntityData = overlayProtocolTimeseriesData[entityName];

      let entitySpecificElements: any = {};
      if (specificChartsOnEntity[entityName]) {
        entitySpecificElements = (specificChartsOnEntity[entityName]);
      }

      const prevEntityName = Object.keys(protocolTimeseriesData)[index - 1];

      if (protocolTimeseriesLoading[entityName] || protocolTimeseriesLoading[prevEntityName]) {
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
          </Grid>)
      }

      if (!currentEntityData && !protocolTimeseriesError[entityName] && protocolTimeseriesError[prevEntityName]) {
        return (
          <Grid key={entityName}>
            <Box my={3}>
              <CopyLinkToClipboard link={window.location.href} scrollId={entityName}>
                <Typography variant="h4" id={entityName}>
                  {entityName}
                </Typography>
              </CopyLinkToClipboard>
            </Box>
            <h3>{entityName} timeseries query could not trigger</h3>
          </Grid>);
      }

      // create state returnedEntity[entityName]
      // Rather than returning the mapped component, set the component to render to state (if unequal to current state for that entity)
      // Render the compoennt from state

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
          setIssues={(issArr: any) => {
            const issuesToAdd: any = {};
            issArr.forEach((issObj: any) => {
              issuesToAdd[issObj.fieldName + issObj.type] = issObj;
            })
            if (Object.keys(issuesToAdd).length > 0) {
              setIssuesToDisplay((prevState) => {
                return ({ ...prevState, ...issuesToAdd })
              })
            }
          }} />
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

  if (!protocolTableData) {
    return <CircularProgress sx={{ margin: 6 }} size={50} />;
  }

  const issuesArrayProps: { message: string; type: string; level: string; fieldName: string }[] = Object.values(issuesToDisplay);

  return (
    <>
      <IssuesDisplay issuesArrayProps={issuesArrayProps} oneLoaded={oneLoaded} allLoaded={allLoaded} />
      <SchemaTable
        entityData={protocolTableData[protocolEntityNameSingular]}
        protocolType={protocolType}
        dataFields={protocolFields}
        schemaName={protocolEntityNameSingular}
        setIssues={(issArr: any) => {
          const issuesToAdd: any = {};
          issArr.forEach((issObj: any) => {
            issuesToAdd[issObj.fieldName + issObj.type] = issObj;
          })
          if (Object.keys(issuesToAdd).length > 0) {
            setIssuesToDisplay((prevState) => {
              return ({ ...prevState, ...issuesToAdd })
            })
          }
        }} />
      {protocolDataRender}
      {specificCharts}
    </>
  );
}

export default ProtocolTab;
