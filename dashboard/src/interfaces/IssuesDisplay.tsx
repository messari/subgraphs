import { styled } from "../styled";
import { Typography } from "@mui/material";
import { useEffect } from "react";
import { useState } from "react";

const IssuesContainer = styled("div") <{ $hasCritical: boolean }>`
  max-height: 230px;
  overflow-y: scroll;
  background-color: rgb(28, 28, 28);
  border: 2px solid
    ${({ theme, $hasCritical }) => ($hasCritical ? theme.palette.error.main : theme.palette.warning.main)};
  margin-bottom: ${({ theme }) => theme.spacing(2)};

  & > * {
    padding: ${({ theme }) => theme.spacing(2)};
  }

  & > :nth-of-type(odd):not(:first-child) {
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
        issuesMsg = `All values in ${issuesArray[x].fieldName} are zero. Verify that this data is being mapped correctly.`;
      }
      if (issuesArray[x].type === "LIQ") {
        issuesMsg = `${issuesArray[x].fieldName} timeseries value cannot be higher than totalValueLockedUSD on the pool. Look at snapshot id ${issuesArray[x].message}`;
      }
      if (issuesArray[x].type === "CUMULATIVE") {
        issuesMsg = `
          ${issuesArray[x].fieldName} cumulative value dropped on snapshot id ${issuesArray[x].message}. Cumulative values should always increase.`;
      }
      if (issuesArray[x].type === "TVL-") {
        issuesMsg = `totalValueLockedUSD on ${issuesArray[x].fieldName} is below 1000.`;
      }
      if (issuesArray[x].type === "TVL+") {
        issuesMsg = `
          totalValueLockedUSD on ${issuesArray[x].fieldName} is above 1,000,000,000,000.`;
      }
      if (issuesArray[x].type === "DEC") {
        issuesMsg = `Decimals on ${issuesArray[x].fieldName} could not be pulled. The default decimal value of 18 has been applied.`;
      }
      if (issuesArray[x].type === "JS") {
        issuesMsg = `JavaScript Error thrown processing the data for ${issuesArray[x].fieldName}: ${issuesArray[x].message}. Verify that the data is in the expected form. If the data is correct and this error persists, leave a message in the 'Validation-Dashboard' Discord channel.`;
      }
      issuesMsgs.push(<li>{issuesMsg}</li>);
    }
  }
  return issuesMsgs;
};

interface IssuesProps {
  issuesArrayProps: { message: string; type: string; level: string; fieldName: string }[];
}
// The issues display function takes the issues object passed in and creates the elements/messages to be rendered
export const IssuesDisplay = ({ issuesArrayProps }: IssuesProps) => {
  const [issuesArray, setIssuesArray] = useState(issuesArrayProps);
  useEffect(() => {
    setIssuesArray(issuesArrayProps);
  }, []);

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

  if (issuesDisplayCount > 0) {
    return (
      <IssuesContainer $hasCritical={hasCritical}>
        <Typography variant="h6">DISPLAYING {issuesDisplayCount} ISSUES.</Typography>
        {criticalElement}
        {errorElement}
        {warningElement}
      </IssuesContainer>
    );
  } else {
    return null;
  }
};

export default IssuesDisplay;
