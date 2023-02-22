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
  const [protocolDataRenderState, setProtocolDataRenderState] = useState<any>({});
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
  const protocolDataRender: any = {};

  const specificCharts: any[] = [];
  const specificChartsOnEntity: any = {};

  if (protocolTimeseriesData) {
    Object.keys(protocolTimeseriesData).forEach((entityName: string, index: number) => {
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
        protocolDataRender[entityName] = ({
          element:
            (<Grid key={entityName}>
              <Box my={3}>
                <CopyLinkToClipboard link={window.location.href} scrollId={entityName}>
                  <Typography variant="h4" id={entityName}>
                    {entityName}
                  </Typography>
                </CopyLinkToClipboard>
              </Box>
              <CircularProgress sx={{ margin: 6 }} size={50} />
            </Grid>), type: 1
        });
      }

      if (!currentEntityData && !protocolTimeseriesError[entityName] && protocolTimeseriesError[prevEntityName]) {
        protocolDataRender[entityName] = ({
          element: (
            <Grid key={entityName}>
              <Box my={3}>
                <CopyLinkToClipboard link={window.location.href} scrollId={entityName}>
                  <Typography variant="h4" id={entityName}>
                    {entityName}
                  </Typography>
                </CopyLinkToClipboard>
              </Box>
              <h3>{entityName} timeseries query could not trigger</h3>
            </Grid>), type: 2
        });
      }

      // create state returnedEntity[entityName]
      // Rather than returning the mapped component, set the component to render to state (if unequal to current state for that entity)
      // Render the compoennt from state

      protocolDataRender[entityName] = ({
        element: (
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

              const issuesToAdd = issArr.filter((issObj: any) => {
                return !issues[entityName].filter((iss: any) => {
                  return issObj.fieldName === iss.fieldName && issObj.type === iss.type
                })
              })

              setIssues(issuesToAdd, entityName)
            }}
          />), type: 3
      });
    });
    Object.keys(protocolDataRender).forEach((entityName: string) => {
      if (protocolDataRender[entityName].type !== protocolDataRenderState[entityName]?.type) {
        setProtocolDataRenderState({ ...protocolDataRenderState, [entityName]: protocolDataRender[entityName] });
      }
    })

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
      {Object.values(protocolDataRenderState).map((x: any) => {
        return x.element
      })}
      {specificCharts}
    </>
  );
}

export default ProtocolTab;
