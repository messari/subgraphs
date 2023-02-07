import React, { useState } from "react";
import IssuesDisplay from "../IssuesDisplay";
import { TablePoolOverview } from "../../common/chartComponents/TablePoolOverview";
import { styled } from "../../styled";
import { Box, CircularProgress, Grid, Typography } from "@mui/material";

import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useNavigate } from "react-router";
import { CopyLinkToClipboard } from "../../common/utilComponents/CopyLinkToClipboard";

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
  const navigate = useNavigate();
  const href = new URL(window.location.href);
  const p = new URLSearchParams(href.search);

  const skipAmtParam = p.get("skipAmt") || "0";
  const [currentPage, setCurrentPage] = useState(skipAmtParam ? (parseInt(skipAmtParam) + 50) / 50 : 1);
  const issues: { message: string; type: string; level: string; fieldName: string }[] = tableIssues;

  let morePages = false;
  if (totalPoolCount) {
    if (currentPage !== Math.ceil(totalPoolCount / 50)) {
      morePages = true;
    }
  }

  let loadingEle = null;

  let nextButton = null;
  if (pools.length === 50 || morePages) {
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

  let table = null;

  if (poolOverviewRequest.poolOverviewError) {
    if (issues.filter((x) => x.fieldName === "Pool Overview Tab").length === 0) {
      issues.push({
        message: poolOverviewRequest?.poolOverviewError?.message + ". Refresh and try again.",
        type: "",
        fieldName: "Pool Overview Tab",
        level: "critical",
      });
    }

    table = (
      (
        <Grid key={"tableID"}>
          <Box my={3}>
            <CopyLinkToClipboard link={window.location.href} scrollId={"tableID"}>
              <Typography variant="h4" id={"tableID"}>
                {poolOverviewRequest?.poolOverviewError?.message}
              </Typography>
            </CopyLinkToClipboard>
          </Box>
        </Grid>
      )
    )
  } else if (poolOverviewRequest.poolOverviewLoading) {
    table = (
      <div>
        <CircularProgress sx={{ margin: 6 }} size={50} />
      </div>
    );
    if (!!pools && pools?.length > 0) {
      table = (
        <div style={{ marginLeft: "16px", marginBottom: "15px" }}>
          <div>
            <CircularProgress sx={{ margin: 6 }} size={50} />
          </div>
          <span>Loading results...</span>
        </div>
      );
    }
  } else {
    table = (
      <TablePoolOverview
        datasetLabel=""
        dataTable={pools}
        protocolType={protocolType}
        protocolNetwork={protocolNetwork}
        skipAmt={skipAmt}
        tablePoolOverviewLoading={poolOverviewRequest.poolOverviewLoading}
        issueProps={tableIssues}
        setPoolId={(x) => setPoolId(x)}
        handleTabChange={(x, y) => handleTabChange(x, y)}
        setIssues={(x) => {
          setTableIssues(x);
        }}
      />
    )
  }

  return (
    <>
      <IssuesDisplay issuesArrayProps={tableIssues} allLoaded={true} oneLoaded={true} />
      {table}
      {loadingEle}
      <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", width: "100%" }}>
        {prevButton}
        <span>
          {totalPoolCount && !loadingEle ? `Page ${currentPage} out of ${Math.ceil(totalPoolCount / 50)}` : null}
        </span>
        {nextButton}
      </div>
    </>
  );
}

export default PoolOverviewTab;
