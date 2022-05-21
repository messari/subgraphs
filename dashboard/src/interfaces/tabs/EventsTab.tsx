import React, { useEffect, useState } from "react";
import { TableEvents } from "../../common/chartComponents/TableEvents";
import { PoolDropDown } from "../../common/utilComponents/PoolDropDown";
import IssuesDisplay from "../IssuesDisplay";
import { Box, Typography } from "@mui/material";

interface EventsTabProps {
  data: any;
  events: string[];
  poolId: string;
  setPoolId: React.Dispatch<React.SetStateAction<string>>;
  poolNames: string;
}

// This component is for each individual subgraph
function EventsTab({ data, events, poolId, setPoolId, poolNames }: EventsTabProps) {
  const [issuesState, setIssues] = useState<{ message: string; type: string; level: string; fieldName: string }[]>([]);
  const issues: { message: string; type: string; level: string; fieldName: string }[] = issuesState;

  useEffect(() => {
    console.log("EVENTS ISSUES TO SET", issues, issuesState);
    setIssues(issues);
  }, [issuesState]);

  return (
    <>
      <IssuesDisplay issuesArray={issues} />
      <PoolDropDown
        poolId={poolId}
        setPoolId={(x) => setPoolId(x)}
        setIssues={(x) => setIssues(x)}
        markets={data[poolNames]}
      />
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
            if (eventName.toUpperCase() === "DEPOSITS" || eventName.toUpperCase() === "SWAPS") {
              level = "critical";
            }
            issues.push({ message, type: "EVENT", level, fieldName: eventName });
          }
          return (
            <Box my={3}>
              <Typography variant="h4">{message}</Typography>
            </Box>
          );
        }
        return <React.Fragment>{TableEvents(eventName, data, eventName, poolId)}</React.Fragment>;
      })}
    </>
  );
}

export default EventsTab;
