import React, { useState } from "react";
import IssuesDisplay from "../IssuesDisplay";
import { TablePoolOverview } from "../../common/chartComponents/TablePoolOverview";
import { styled } from "../../styled";
import { CircularProgress } from "@mui/material";

import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useNavigate } from "react-router";

const ChangePageEle = styled("div")`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
  padding: ${({ theme }) => theme.spacing(2)};
  margin: 10px 0;
  cursor: pointer;
`;

interface PoolOverviewTabProps {
  totalPoolCount?: number;
  pools: any[];
  protocolType: string;
  protocolNetwork: string;
  subgraphToQueryURL: string;
  poolOverviewRequest: { [x: string]: any };
  skipAmt: number;
  handleTabChange: (event: any, newValue: string) => void;
  setPoolId: React.Dispatch<React.SetStateAction<string>>;
  paginate: React.Dispatch<React.SetStateAction<number>>;
}

// This component is for each individual subgraph
function PoolOverviewTab({
  totalPoolCount,
  pools,
  setPoolId,
  protocolType,
  protocolNetwork,
  poolOverviewRequest,
  handleTabChange,
  paginate,
  skipAmt,
}: PoolOverviewTabProps) {
  const [tableIssues, setTableIssues] = useState<{ message: string; type: string; level: string; fieldName: string }[]>(
    [],
  );
  const [currentPage, setCurrentPage] = useState(1);
  const issues: { message: string; type: string; level: string; fieldName: string }[] = tableIssues;

  const navigate = useNavigate();
  const href = new URL(window.location.href);
  const p = new URLSearchParams(href.search);
  if (!!poolOverviewRequest.poolOverviewError && issues.filter((x) => x.fieldName === "PoolOverviewTab").length === 0) {
    issues.push({
      message: poolOverviewRequest?.poolOverviewError?.message + ". Refresh and try again.",
      type: "",
      fieldName: "PoolOverviewTab",
      level: "critical",
    });
  }

  if (poolOverviewRequest.poolOverviewLoading) {
    return <CircularProgress sx={{ margin: 6 }} size={50} />;
  }

  let nextButton = null;
  if (pools.length === 50) {
    nextButton = (
      <ChangePageEle
        onClick={() => {
          window.scrollTo(0, 0);
          paginate(skipAmt + 50);
          p.set("skipAmt", (skipAmt + 50).toString());
          navigate("?" + p.toString());
          setCurrentPage((prev) => prev + 1);
          setTableIssues([]);
        }}
      >
        <span>NEXT</span>
        <ChevronRightIcon />
      </ChangePageEle>
    );
  }

  let prevButton = <ChangePageEle></ChangePageEle>;
  if (skipAmt > 0 && skipAmt <= 50) {
    prevButton = (
      <ChangePageEle
        onClick={() => {
          window.scrollTo(0, document.body.scrollHeight);
          paginate(0);
          p.delete("skipAmt");
          navigate("?" + p.toString());
          setCurrentPage((prev) => prev - 1);
          setTableIssues([]);
        }}
      >
        <ChevronLeftIcon />
        <span>BACK</span>
      </ChangePageEle>
    );
  } else if (skipAmt > 0) {
    prevButton = (
      <ChangePageEle
        onClick={() => {
          window.scrollTo(0, document.body.scrollHeight);
          paginate(skipAmt - 50);
          p.set("skipAmt", (skipAmt - 50).toString());
          navigate("?" + p.toString());
          setCurrentPage((prev) => prev - 1);
          setTableIssues([]);
        }}
      >
        <ChevronLeftIcon />
        <span>BACK</span>
      </ChangePageEle>
    );
  }

  if (!poolOverviewRequest.poolOverviewLoading && pools.length === 0) {
    if (skipAmt > 0) {
      p.delete("skipAmt");
      window.location.href = `${href.origin}${href.pathname}?${p.toString()}`;
    } else if (issues.filter((x) => x.fieldName === "PoolOverviewTab").length === 0) {
      issues.push({
        message: "No pools returned in pool overview.",
        type: "POOL",
        level: "error",
        fieldName: "poolOverview",
      });
    }
  }

  return (
    <>
      <IssuesDisplay issuesArrayProps={tableIssues} allLoaded={true} oneLoaded={true} />
      <TablePoolOverview
        datasetLabel=""
        dataTable={pools}
        protocolType={protocolType}
        protocolNetwork={protocolNetwork}
        skipAmt={skipAmt}
        issueProps={tableIssues}
        setPoolId={(x) => setPoolId(x)}
        handleTabChange={(x, y) => handleTabChange(x, y)}
        setIssues={(x) => {
          setTableIssues(x);
        }}
      />
      <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", width: "100%" }}>
        {prevButton}
        <span>{totalPoolCount ? `Page ${currentPage} out of ${Math.ceil(totalPoolCount / 50)}` : null}</span>
        {nextButton}
      </div>
    </>
  );
}

export default PoolOverviewTab;
