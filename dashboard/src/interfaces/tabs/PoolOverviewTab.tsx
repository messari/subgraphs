import React, { useEffect, useState } from "react";
import { TableEvents } from "../../common/chartComponents/TableEvents";
import { PoolDropDown } from "../../common/utilComponents/PoolDropDown";
import IssuesDisplay from "../IssuesDisplay";
import { Box, Typography } from "@mui/material";
import { Pool } from "../Pool";
import { styled } from "../../styled";

interface PoolOverviewTabProps {
  pools: any[];
  protocolData: { [x: string]: any };
}

const PoolContainer = styled("div")`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing(2)};
`;

// This component is for each individual subgraph
function PoolOverviewTab({ pools, protocolData }: PoolOverviewTabProps) {
  const [issuesState, setIssues] = useState<{ message: string; type: string; level: string; fieldName: string }[]>([]);
  const issues: { message: string; type: string; level: string; fieldName: string }[] = issuesState;

  // useEffect(() => {
  //     console.log("PoolOverview ISSUES TO SET", issues, issuesState);
  //     setIssues(issues);
  // }, [issuesState]);

  return (
    <>
      <IssuesDisplay issuesArrayProps={issues} />
      <PoolContainer>
        {pools.map((pool) => {
          return <Pool pool={pool} protocolData={protocolData} />;
        })}
      </PoolContainer>
    </>
  );
}

export default PoolOverviewTab;
