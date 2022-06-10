import { TabContext, TabPanel } from "@mui/lab";
import { CircularProgress, Tab, Tabs } from "@mui/material";
import React from "react";
import { ProtocolTypeEntityName, ProtocolTypeEntityNames } from "../constants";
import EventsTab from "./tabs/EventsTab";
import PoolTab from "./tabs/PoolTab";
import ProtocolTab from "./tabs/ProtocolTab";
import { styled } from "../styled";
import PoolOverviewTab from "./tabs/PoolOverviewTab";
import { ProtocolDropDown } from "../common/utilComponents/ProtocolDropDown";

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
  protocolTableData: any;
  poolsListData: { [x: string]: any };
  poolListLoading: any;
  poolsListError: any;
  handleTabChange: (event: any, newValue: string) => void;
  setPoolId: React.Dispatch<React.SetStateAction<string>>;
  setProtocolId: React.Dispatch<React.SetStateAction<string>>;
  paginate: React.Dispatch<React.SetStateAction<number>>;
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
  poolsListError,
  handleTabChange,
  setPoolId,
  setProtocolId,
  paginate
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

  return (
    <>
      <TabContext value={tabValue}>
        <StyledTabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Protocol" value="1" />
          <Tab label="Pool Overview" value="2" />
          <Tab label="Pool" value="3" />
          <Tab label="Events" value="4" />
        </StyledTabs>
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
          />
        </TabPanel>
        <TabPanel value="2">
          {/* POOLOVERVIEW TAB */}
          <PoolOverviewTab
            skipAmt={skipAmt}
            pools={pools}
            protocolType={data.protocols[0].type}
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
        <TabPanel value="4">
          {/* EVENTS TAB */}
          <EventsTab
            data={data}
            events={events}
            poolId={poolId}
            poolsList={poolsListData}
            poolListLoading={poolListLoading}
            poolNames={poolNames}
            setPoolId={(x) => setPoolId(x)}
          />
        </TabPanel>
      </TabContext>
    </>
  );
}

export default AllDataTabs;
