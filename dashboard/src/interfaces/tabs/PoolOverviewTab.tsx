import React from "react";
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

const PoolContainer = styled("div")`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing(2)};
`;

interface PoolOverviewTabProps {
  pools: any[];
  protocolType: string;
  subgraphToQueryURL: string;
  poolOverviewRequest: { [x: string]: any };
  handleTabChange: (event: any, newValue: string) => void;
  setPoolId: React.Dispatch<React.SetStateAction<string>>;
  paginate: React.Dispatch<React.SetStateAction<number>>;
  skipAmt: number;
}

// This component is for each individual subgraph
function PoolOverviewTab({
  pools,
  setPoolId,
  protocolType,
  poolOverviewRequest,
  handleTabChange,
  paginate,
  skipAmt,
}: PoolOverviewTabProps) {
  const issues: { message: string; type: string; level: string; fieldName: string }[] = [];
  const navigate = useNavigate();
  const href = new URL(window.location.href);
  const p = new URLSearchParams(href.search);
  if (!!poolOverviewRequest.poolOverviewError) {
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
    } else {
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
      <IssuesDisplay issuesArrayProps={issues} allLoaded={true} oneLoaded={true} />
      <TablePoolOverview
        datasetLabel=""
        dataTable={pools}
        protocolType={protocolType}
        skipAmt={skipAmt}
        setPoolId={(x) => setPoolId(x)}
        handleTabChange={(x, y) => handleTabChange(x, y)}
      />
      <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", width: "100%" }}>
        {prevButton}
        {nextButton}
      </div>
    </>
  );
}

export default PoolOverviewTab;
