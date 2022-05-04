  // The warning display function takes the warning object passed in and creates the elements/messages to be rendered
  function WarningDisplay (warningArray: {message: string, type: string}[]) {
    const warningMsgs = [];
    let warningTotalCount = 0;
    let warningDisplayCount = 0;

    if (warningArray.length > 0) {
      warningTotalCount += warningArray.length;
      for (let x = 0; x < 5; x++) {
        // Take up to the first 5 query warning messages and push them to the warningMsgs array
        if (!warningArray[x]) {
          break;
        }
        let warningMsg = warningArray[x].message;
        if (warningArray[x].type === 'SUM') {
            warningMsg = "All values in " + warningArray[x].message + " are zero. Verify that this data is being mapped correctly.";
        }
        warningDisplayCount += 1;
        warningMsgs.push(<li>{warningMsg}</li>);
      }
    }

    if (warningMsgs.length >= 1) {
      return (
        <div style={{margin: "4px 24px", border: "yellow 3px solid", paddingLeft: "8px"}}>
          <h3>DISPLAYING {warningDisplayCount} OUT OF {warningTotalCount} WARNINGS.</h3>
          <ol>{warningMsgs}</ol>
        </div>);
    } else {
      return null;
    }
  }

export default WarningDisplay;