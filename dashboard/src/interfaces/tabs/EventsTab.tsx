import React, { useEffect, useState } from "react";
import { TableEvents } from "../../common/chartComponents/TableEvents";
import { PoolDropDown } from "../../common/utilComponents/PoolDropDown";
import IssuesDisplay from "../IssuesDisplay";
import { Box, CircularProgress, Typography } from "@mui/material";

interface EventsTabProps {
  data: any;
  events: string[];
  protocolNetwork: string;
  poolId: string;
  poolsList: { [x: string]: any[] };
  poolListLoading: any;
  poolNames: string;
  setPoolId: React.Dispatch<React.SetStateAction<string>>;
}

// This component is for each individual subgraph
function EventsTab({
  data,
  events,
  protocolNetwork,
  poolId,
  setPoolId,
  poolsList,
  poolNames,
  poolListLoading,
}: EventsTabProps) {
  const [issuesState, setIssues] = useState<{ message: string; type: string; level: string; fieldName: string }[]>([]);
  const issues: { message: string; type: string; level: string; fieldName: string }[] = issuesState;

  useEffect(() => {
    console.log("EVENTS ISSUES TO SET", issues, issuesState);
    setIssues(issues);
  }, [issuesState]);

  let poolDropDown = null;
  if (poolsList) {
    poolDropDown = (
      <PoolDropDown
        poolId={poolId}
        pools={poolsList[poolNames]}
        setPoolId={(x) => {
          setIssues([]);
          setPoolId(x);
        }}
      />
    );
  } else if (poolListLoading) {
    return <CircularProgress sx={{ margin: 6 }} size={50} />;
  }

  return (
    <>
      <IssuesDisplay issuesArrayProps={issues} allLoaded={true} oneLoaded={true} />
      {poolDropDown}
      {events.map((eventName) => {
        if (!poolId && data[eventName].length > 0) {
          const message = `${eventName} events found with a pool id of "". All events need to be linked to a pool/market/vault by a valid id.`;
          if (issues.filter((x) => x.message === message).length === 0) {
            issues.push({ message, type: "NOEV", level: "critical", fieldName: eventName });
          }
        }
        if (poolId && data[eventName].length === 0) {
          const message = "No " + eventName + " on pool " + poolId;
          if (issues.filter((x) => x.message === message).length === 0) {
            let level = "warning";
            if (eventName.toUpperCase() === "DEPOSITS") {
              level = "critical";
            }
            issues.push({ message, type: "EVENT", level, fieldName: eventName });
          }
          return (
            <Box key={eventName}>
              <Typography fontSize={20}>
                <b>{eventName.toUpperCase()}</b>
              </Typography>
              <Typography variant="body1">{message}</Typography>
            </Box>
          );
        }
        return (
          <TableEvents
            key={eventName + "Table"}
            protocolNetwork={protocolNetwork}
            datasetLabel={eventName}
            data={data}
            eventName={eventName}
          />
        );
      })}
    </>
  );
}

export default EventsTab;
