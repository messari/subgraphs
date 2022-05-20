import { toDate } from "../utils";

const messagesByLevel = (
  issuesArray: { message: string; type: string; level: string; fieldName: string }[],
): JSX.Element[] => {
  const issuesMsgs = [];
  console.log("ARRAY ISSUEDISPLAY COMPONENT", issuesArray);
  if (issuesArray.length > 0) {
    for (let x = 0; x < issuesArray.length; x++) {
      let issuesMsg = issuesArray[x].fieldName;
      if (issuesArray[x].type === "SUM") {
        issuesMsg =
          "All values in " + issuesArray[x].fieldName + " are zero. Verify that this data is being mapped correctly.";
      }
      if (issuesArray[x].type === "CUMULATIVE") {
        issuesMsg =
          "Cumulative value in field " +
          issuesArray[x].message.split("++")[0] +
          " dropped on " +
          toDate(parseFloat(issuesArray[x].message.split("++")[1])) +
          ". Cumulative values should always increase.";
      }
      if (issuesArray[x].type === "TVL-") {
        issuesMsg = "totalValueLockedUSD on " + issuesArray[x].message + " is below 1000. This is likely erroneous.";
      }
      if (issuesArray[x].type === "TVL+") {
        issuesMsg =
          "totalValueLockedUSD on " + issuesArray[x].message + " is above 1,000,000,000,000. This is likely erroneous.";
      }
      if (issuesArray[x].type === "DEC") {
        issuesMsg = `Decimals on ${issuesArray[x].fieldName} could not be pulled. The default decimal value of 18 has been applied.`;
      }
      issuesMsgs.push(<li>{issuesMsg}</li>);
    }
  }
  return issuesMsgs;
};

interface IssuesProps {
  issuesArray: { message: string; type: string; level: string; fieldName: string }[];
}
// The issues display function takes the issues object passed in and creates the elements/messages to be rendered
export const IssuesDisplay = ({ issuesArray }: IssuesProps) => {
  console.log("issARRAY", issuesArray);
  const criticalIssues = issuesArray.filter((iss) => iss.level === "critical");
  const errorIssues = issuesArray.filter((iss) => iss.level === "error");
  const warningIssues = issuesArray.filter((iss) => {
    console.log("ISS", iss, iss.level === "warning");
    return iss.level === "warning";
  });

  const criticalMsgs = messagesByLevel(criticalIssues);
  const errorMsgs = messagesByLevel(errorIssues);
  const warningMsgs = messagesByLevel(warningIssues);

  const issuesDisplayCount = criticalMsgs.length + errorMsgs.length + warningMsgs.length;

  let criticalElement = null;
  if (criticalMsgs.length > 0) {
    criticalElement = (
      <div style={{ borderBottom: "black 2px solid" }}>
        <h3>Critical:</h3>
        <ol>{criticalMsgs}</ol>
      </div>
    );
  }

  let errorElement = null;
  if (errorMsgs.length > 0) {
    errorElement = (
      <div style={{ borderBottom: "black 2px solid" }}>
        <h3>Error:</h3>
        <ol>{errorMsgs}</ol>
      </div>
    );
  }

  let warningElement = null;
  if (warningMsgs.length > 0) {
    warningElement = (
      <div style={{ borderBottom: "black 2px solid" }}>
        <h3>Warning:</h3>
        <ol>{warningMsgs}</ol>
      </div>
    );
  }

  if (issuesDisplayCount > 0) {
    return (
      <div
        style={{
          margin: "4px 24px",
          border: "yellow 3px solid",
          paddingLeft: "8px",
          maxHeight: "230px",
          overflow: "scroll",
        }}
      >
        <h3>DISPLAYING {issuesDisplayCount} Issues.</h3>
        {criticalElement}
        {errorElement}
        {warningElement}
      </div>
    );
  } else {
    return null;
  }
};

export default IssuesDisplay;
