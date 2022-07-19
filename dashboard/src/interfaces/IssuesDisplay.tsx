import { styled } from "../styled";
import { CircularProgress, Typography } from "@mui/material";
import React, { useEffect } from "react";
import { useState } from "react";

const IssuesContainer = styled("div")<{ $hasCritical: boolean }>`
  max-height: 230px;
  overflow-y: scroll;
  background-color: rgb(28, 28, 28);
  border: 2px solid
    ${({ theme, $hasCritical }) => ($hasCritical ? theme.palette.error.main : theme.palette.warning.main)};
  margin-bottom: ${({ theme }) => theme.spacing(2)};

  & > * {
    padding: ${({ theme }) => theme.spacing(2)};
  }

  & > :nth-of-type(odd):not(:first-of-type) {
    background: rgba(0, 0, 0, 0.5);
  }
`;

const messagesByLevel = (
  issuesArray: { message: string; type: string; level: string; fieldName: string }[],
): JSX.Element[] => {
  const issuesMsgs = [];
  if (issuesArray.length > 0) {
    for (let x = 0; x < issuesArray.length; x++) {
      let issuesMsg = (issuesArray[x].fieldName ? issuesArray[x].fieldName + ": " : "") + issuesArray[x].message;
      if (issuesArray[x].type === "SUM") {
        issuesMsg = `All values in ${issuesArray[x].fieldName} are 0. Verify that this data is being mapped correctly.`;
      }
      if (issuesArray[x].type === "LIQ") {
        issuesMsg = `${issuesArray[x].fieldName} timeseries value cannot be higher than totalValueLockedUSD on the pool. Look at snapshot id ${issuesArray[x].message}`;
      }
      if (issuesArray[x].type === "CUMULATIVE") {
        issuesMsg = `
          ${issuesArray[x].fieldName} cumulative value dropped on snapshot id ${issuesArray[x].message}. Cumulative values should always increase.`;
      }
      if (issuesArray[x].type === "TOTAL_REV") {
        const msgObj = JSON.parse(issuesArray[x].message);
        issuesMsg = `
          ${issuesArray[x].fieldName} sum value (${msgObj.totalRevenue}) diverged from protocol + supply revenue (${msgObj.sumRevenue}) by ${msgObj.divergence}% starting from snapshot id ${msgObj.timeSeriesInstanceId}.`;
      }
      if (issuesArray[x].type === "TOTAL_TX") {
        const msgObj = JSON.parse(issuesArray[x].message);
        issuesMsg = `
          ${issuesArray[x].fieldName} sum value (${msgObj.totalTx}) diverged from sum of individual transactions (${msgObj.individualTxSum}) by ${msgObj.divergence}% starting from snapshot id ${msgObj.timeSeriesInstanceId}.`;
      }
      if (issuesArray[x].type === "TVL-") {
        issuesMsg = `${issuesArray[x].fieldName} is below 1000.`;
      }
      if (issuesArray[x].type === "TVL+") {
        issuesMsg = `${issuesArray[x].fieldName} is above 1,000,000,000,000.`;
      }
      if (issuesArray[x].type === "DEC") {
        issuesMsg = `Decimals on ${issuesArray[x].fieldName} could not be pulled. The default decimal value of 18 has been applied.`;
      }
      if (issuesArray[x].type === "JS") {
        issuesMsg = `JavaScript Error thrown processing the data for ${issuesArray[x].fieldName}: ${issuesArray[x].message}. Verify that the data is in the expected form. If the data is correct and this error persists, leave a message in the 'Validation-Dashboard' Discord channel.`;
      }
      if (issuesArray[x].type === "VAL") {
        issuesMsg = issuesArray[x].message;
      }
      if (issuesArray[x].type === "TOK") {
        issuesMsg = `'${issuesArray[x].fieldName}' in the timeseries data refers to a token that does not exist on this pool. '${issuesArray[x].message}' references an invalid index.`;
      }
      if (issuesArray[x].type === "NEG") {
        const msgObj = JSON.parse(issuesArray[x].message);
        issuesMsg = `'${issuesArray[x].fieldName}' has ${msgObj.count} negative values. First instance of a negative value is on snapshot ${msgObj.firstSnapshot} with a value of ${msgObj.value}`;
      }
      if (issuesArray[x].type === "NAN") {
        issuesMsg = `'${issuesArray[x].fieldName}' is NaN.`;
      }
      if (issuesArray[x].type === "RATENEG") {
        issuesMsg = `'${issuesArray[x].fieldName}' has a negative rate.`;
      }
      if (issuesArray[x].type === "RATEZERO") {
        issuesMsg = `'${issuesArray[x].fieldName}' has a zero rate.`;
      }
      if (issuesArray[x].type === "EMPTY") {
        issuesMsg = `Entity ${issuesArray[x].fieldName} has no instances. This could mean that the pool was created but no transactions were detected on it.`;
      }
      if (issuesArray[x].type === "BORROW") {
        issuesMsg = `Entity ${issuesArray[x].fieldName} could not calculate BORROW Reward APR. The Pool Borrow Balance is not available.`;
      }
      issuesMsgs.push(<li key={`${x}-${issuesArray[x].fieldName}`}>{issuesMsg}</li>);
    }
  }
  return issuesMsgs;
};

interface IssuesProps {
  issuesArrayProps: { message: string; type: string; level: string; fieldName: string }[];
  allLoaded: boolean;
  oneLoaded: boolean;
}
// The issues display function takes the issues object passed in and creates the elements/messages to be rendered
export const IssuesDisplay = ({ issuesArrayProps, allLoaded, oneLoaded }: IssuesProps) => {
  const [issuesArray, setIssuesArray] = useState<{ message: string; type: string; level: string; fieldName: string }[]>(
    [],
  );
  useEffect(() => {
    setIssuesArray(issuesArrayProps);
  }, [issuesArrayProps]);
  let waitingElement: JSX.Element | null = (
    <>
      <Typography variant="h6">WAITING TO SCAN DATA FOR ISSUES...</Typography>
      <CircularProgress sx={{ margin: 6 }} size={50} />
    </>
  );
  if (!oneLoaded && !allLoaded && issuesArray.length === 0) {
    return <IssuesContainer $hasCritical={false}>{waitingElement}</IssuesContainer>;
  }

  const criticalIssues = issuesArray.filter((iss) => iss.level === "critical");
  const errorIssues = issuesArray.filter((iss) => iss.level === "error");
  const warningIssues = issuesArray.filter((iss) => iss.level === "warning");

  const criticalMsgs = messagesByLevel(criticalIssues);
  const errorMsgs = messagesByLevel(errorIssues);
  const warningMsgs = messagesByLevel(warningIssues);

  const issuesDisplayCount = criticalMsgs.length + errorMsgs.length + warningMsgs.length;
  const hasCritical = criticalMsgs.length > 0;

  let criticalElement = null;
  if (hasCritical) {
    criticalElement = (
      <div>
        <Typography variant="h6">Critical:</Typography>
        <ol>
          <Typography variant="body1">{criticalMsgs}</Typography>
        </ol>
      </div>
    );
  }

  let errorElement = null;
  if (errorMsgs.length > 0) {
    errorElement = (
      <div>
        <Typography variant="h6">Error:</Typography>
        <ol>
          <Typography variant="body1">{errorMsgs}</Typography>
        </ol>
      </div>
    );
  }

  let warningElement = null;
  if (warningMsgs.length > 0) {
    warningElement = (
      <div>
        <Typography variant="h6">Warning:</Typography>
        <ol>
          <Typography variant="body1">{warningMsgs}</Typography>
        </ol>
      </div>
    );
  }

  if (allLoaded) {
    waitingElement = null;
  }

  if (issuesDisplayCount > 0) {
    return (
      <IssuesContainer $hasCritical={hasCritical}>
        <Typography variant="h6">DISPLAYING {issuesDisplayCount} ISSUES.</Typography>
        {criticalElement}
        {errorElement}
        {warningElement}
        {waitingElement}
      </IssuesContainer>
    );
  } else {
    return null;
  }
};

export default IssuesDisplay;
