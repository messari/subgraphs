import { TabContext, TabPanel } from "@mui/lab";
import { Tab, Tabs } from "@mui/material";
import React from "react";
import { ProtocolTypeEntity } from "../constants";
import EventsTab from "./tabs/EventsTab";
import PoolTab from "./tabs/PoolTab";
import ProtocolTab from "./tabs/ProtocolTab";
import { styled } from "../styled";

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
  const protocolEntityName = ProtocolTypeEntity[data.protocols[0].type];
  console.log("FULLDATAOBJ", data, data[protocolEntityName][0]?.lendingType, "sloop", events);
  if (data[protocolEntityName][0]?.lendingType === "CDP") {
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
        </StyledTabs>
        <TabPanel value="1">
          {/* PROTOCOL TAB */}
          <ProtocolTab data={data} entities={entities} entitiesData={entitiesData} protocolFields={protocolFields} />
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
      </TabContext>
    </>
  );
}

export default AllDataTabs;
