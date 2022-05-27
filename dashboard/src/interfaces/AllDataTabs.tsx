import { TabContext, TabPanel } from "@mui/lab";
import { Tab, Tabs } from "@mui/material";
import React from "react";
import { ProtocolTypeEntityName, ProtocolTypeEntityNames } from "../constants";
import EventsTab from "./tabs/EventsTab";
import PoolTab from "./tabs/PoolTab";
import ProtocolTab from "./tabs/ProtocolTab";
import { styled } from "../styled";
import PoolOverviewTab from "./tabs/PoolOverviewTab";

const StyledTabs = styled(Tabs)`
  background: #292f38;
  padding-left: ${({ theme }) => theme.spacing(3)};
`;

interface AllDataTabsProps {
  data: any;
  entities: string[];
  entitiesData: { [x: string]: { [x: string]: string } };
  protocolFields: { [x: string]: string };
  tabValue: string;
  handleTabChange: (event: any, newValue: string) => void;
  poolId: string;
  poolData: { [x: string]: string };
  events: string[];
  setPoolId: React.Dispatch<React.SetStateAction<string>>;
  poolNames: string;
}

// This component is for each individual subgraph
function AllDataTabs({
  data,
  entities,
  entitiesData,
  protocolFields,
  tabValue,
  handleTabChange,
  poolId,
  poolData,
  events,
  setPoolId,
  poolNames,
}: AllDataTabsProps) {
  const protocolEntityName = ProtocolTypeEntityName[data.protocols[0].type];
  const protocolEntityNames = ProtocolTypeEntityNames[data.protocols[0].type];

  let protocolData = data[protocolEntityName];
  if (!protocolData) {
    protocolData = data[protocolEntityNames][0];
  }
  console.log("FULLDATAOBJ", data, protocolData, "sloop", events);
  if (protocolData?.lendingType === "CDP") {
    protocolFields.mintedTokens += "!";
    protocolFields.mintedTokenSupplies += "!";
  }

  return (
    <>
      <TabContext value={tabValue}>
        <StyledTabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Protocol" value="1" />
          <Tab label="Pool" value="2" />
          <Tab label="Events" value="3" />
          <Tab label="Pool Overview" value="4" />
        </StyledTabs>
        <TabPanel value="1">
          {/* PROTOCOL TAB */}
          <ProtocolTab
            data={data}
            protocolData={protocolData}
            entities={entities}
            entitiesData={entitiesData}
            protocolFields={protocolFields}
          />
        </TabPanel>
        <TabPanel value="2">
          {/* POOL TAB */}
          <PoolTab
            data={data}
            entities={entities}
            entitiesData={entitiesData}
            poolId={poolId}
            setPoolId={(x) => setPoolId(x)}
            poolData={poolData}
            protocolData={protocolData}
          />
        </TabPanel>
        <TabPanel value="3">
          {/* EVENTS TAB */}
          <EventsTab
            data={data}
            events={events}
            poolId={poolId}
            setPoolId={(x) => setPoolId(x)}
            poolNames={poolNames}
          />
        </TabPanel>
        <TabPanel value="4">
          {/* POOLOVERVIEW TAB */}
          <PoolOverviewTab pools={data[poolNames]} protocolData={protocolData} />
        </TabPanel>
      </TabContext>
    </>
  );
}

export default AllDataTabs;
