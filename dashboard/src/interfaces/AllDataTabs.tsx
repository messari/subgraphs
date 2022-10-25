import { TabContext, TabPanel } from "@mui/lab";
import { CircularProgress, Tab, Tabs } from "@mui/material";
import React from "react";
import EventsTab from "./tabs/EventsTab";
import PoolTab from "./tabs/PoolTab";
import ProtocolTab from "./tabs/ProtocolTab";
import { styled } from "../styled";
import PoolOverviewTab from "./tabs/PoolOverviewTab";
import { ProtocolDropDown } from "../common/utilComponents/ProtocolDropDown";
import { PoolName, ProtocolTypeEntityName, ProtocolTypeEntityNames } from "../constants";
import PositionTab from "./tabs/PositionTab";
import { NewClient } from "../utils";
import { NormalizedCacheObject, ApolloClient } from "@apollo/client";
import { DeploymentOverlayDropDown } from "../common/utilComponents/DeploymentOverlayDropDown";

const StyledTabs = styled(Tabs)`
  background: #292f38;
  padding-left: ${({ theme }) => theme.spacing(3)};
`;

interface AllDataTabsProps {
  data: any;
  entitiesData: { [x: string]: { [x: string]: string } };
  protocolFields: { [x: string]: string };
  tabValue: string;
  pools: any[];
  poolId: string;
  poolData: { [x: string]: string };
  poolNames: string;
  events: string[];
  subgraphToQueryURL: string;
  skipAmt: number;
  poolOverviewRequest: { [x: string]: any };
  poolTimeseriesRequest: { [x: string]: any };
  protocolTimeseriesData: any;
  protocolTimeseriesLoading: any;
  protocolTimeseriesError: any;
  overlayProtocolTimeseriesData: any;
  protocolTableData: any;
  poolsListData: { [x: string]: any };
  poolListLoading: any;
  poolsListError: any;
  positionsQuery?: string;
  overlayDeploymentClient: ApolloClient<NormalizedCacheObject>;
  overlayDeploymentURL: string;
  handleTabChange: (event: any, newValue: string) => void;
  setPoolId: React.Dispatch<React.SetStateAction<string>>;
  setProtocolId: React.Dispatch<React.SetStateAction<string>>;
  paginate: React.Dispatch<React.SetStateAction<number>>;
  setOverlayDeploymentClient: React.Dispatch<React.SetStateAction<ApolloClient<NormalizedCacheObject>>>;
  setOverlayDeploymentURL: React.Dispatch<React.SetStateAction<string>>;
}

// This component is for each individual subgraph
function AllDataTabs({
  data,
  entitiesData,
  protocolFields,
  tabValue,
  pools,
  poolNames,
  poolId,
  poolData,
  events,
  subgraphToQueryURL,
  skipAmt,
  poolOverviewRequest,
  poolTimeseriesRequest,
  protocolTimeseriesData,
  protocolTableData,
  poolsListData,
  poolListLoading,
  protocolTimeseriesLoading,
  protocolTimeseriesError,
  overlayProtocolTimeseriesData,
  poolsListError,
  positionsQuery,
  overlayDeploymentClient,
  overlayDeploymentURL,
  handleTabChange,
  setPoolId,
  setProtocolId,
  paginate,
  setOverlayDeploymentClient,
  setOverlayDeploymentURL
}: AllDataTabsProps) {
  let protocolDropDown = null;
  if (data.protocols.length > 1) {
    protocolDropDown = (
      <div style={{ padding: "24px" }}>
        <ProtocolDropDown setProtocolId={(x) => setProtocolId(x)} protocols={data.protocols} />
      </div>
    );
  }

  if (protocolTableData?.lendingType === "CDP") {
    protocolFields.mintedTokens += "!";
    protocolFields.mintedTokenSupplies += "!";
  }

  if (!protocolTableData) {
    return <CircularProgress sx={{ margin: 6 }} size={50} />;
  }

  const protocolType = data.protocols[0].type;
  const protocolEntityNamesPlural = ProtocolTypeEntityNames[protocolType];
  const protocolEntityNameSingular = ProtocolTypeEntityName[protocolType];
  const network = data[protocolEntityNamesPlural][0].network;

  let eventsTab = null;
  let eventsTabButton = null;
  if (protocolType !== "GENERIC") {
    eventsTabButton = <Tab label="Events" value="4" />;
    eventsTab = (
      <TabPanel value="4">
        {/* EVENTS TAB */}
        <EventsTab
          data={data}
          events={events}
          protocolNetwork={network}
          poolId={poolId}
          poolsList={poolsListData}
          poolListLoading={poolListLoading}
          poolNames={poolNames}
          setPoolId={(x) => setPoolId(x)}
        />
      </TabPanel>
    );
  }
  return (
    <>
      <TabContext value={tabValue}>
        <div style={{ display: "flex", backgroundColor: "#292f38", justifyContent: "space-between", alignItems: "center" }}>
          <StyledTabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Protocol" value="1" />
            <Tab label="Pool Overview" value="2" />
            <Tab label="Pool" value="3" />
            {eventsTabButton}
            {positionsQuery && <Tab label="Positions" value="5" />}
          </StyledTabs>
          <DeploymentOverlayDropDown setDeploymentURL={(x: string) => {
            setOverlayDeploymentClient(NewClient(x));
            setOverlayDeploymentURL(x);
          }} deploymentsList={[{ value: "", label: "UNSELECT" }, { value: subgraphToQueryURL, label: "TEST - " + subgraphToQueryURL }]} currentDeploymentURL={overlayDeploymentURL} />
        </div>
        {protocolDropDown}
        <TabPanel value="1">
          {/* PROTOCOL TAB */}
          <ProtocolTab
            entitiesData={entitiesData}
            protocolFields={protocolFields}
            protocolType={data.protocols[0].type}
            protocolTableData={protocolTableData}
            protocolTimeseriesData={protocolTimeseriesData}
            protocolTimeseriesLoading={protocolTimeseriesLoading}
            protocolTimeseriesError={protocolTimeseriesError}
            overlayProtocolTimeseriesData={overlayProtocolTimeseriesData}
          />
        </TabPanel>
        <TabPanel value="2">
          {/* POOLOVERVIEW TAB */}
          <PoolOverviewTab
            totalPoolCount={protocolTableData[protocolEntityNameSingular].totalPoolCount}
            skipAmt={skipAmt}
            pools={pools}
            protocolType={data.protocols[0].type}
            protocolNetwork={network}
            poolOverviewRequest={poolOverviewRequest}
            subgraphToQueryURL={subgraphToQueryURL}
            setPoolId={(x) => setPoolId(x)}
            paginate={(x) => paginate(x)}
            handleTabChange={(x, y) => handleTabChange(x, y)}
          />
        </TabPanel>
        <TabPanel value="3">
          {/* POOL TAB */}
          <PoolTab
            data={data}
            entitiesData={entitiesData}
            poolTimeseriesData={poolTimeseriesRequest.poolTimeseriesData}
            poolTimeseriesLoading={poolTimeseriesRequest.poolTimeseriesLoading}
            poolTimeseriesError={poolTimeseriesRequest.poolTimeseriesError}
            poolId={poolId}
            poolData={poolData}
            poolsListError={poolsListError}
            poolsList={poolsListData}
            poolListLoading={poolListLoading}
            poolNames={poolNames}
            protocolData={protocolTableData}
            setPoolId={(x) => setPoolId(x)}
          />
        </TabPanel>
        {eventsTab}
        {positionsQuery && (
          <TabPanel value="5">
            {/* POSITIONS TAB */}
            <PositionTab
              positions={data[PoolName[protocolType]]?.positions}
              poolId={poolId}
              poolsList={poolsListData}
              poolListLoading={poolListLoading}
              poolsListError={poolsListError}
              poolNames={poolNames}
              setPoolId={(x) => setPoolId(x)}
            />
          </TabPanel>
        )}
      </TabContext>
    </>
  );
}

export default AllDataTabs;
