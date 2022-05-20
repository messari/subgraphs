import { toDate } from "../utils";
import { styled } from "../styled";
import { Typography } from "@mui/material";
import { ProtocolWarning } from "../graphs/types";

const StyledWarnings = styled("div")`
  max-height: 230px;
  overflow-y: scroll;
  background-color: rgb(28, 28, 28);
  box-shadow: inset 0 0 1px 2px ${({ theme }) => theme.palette.warning.main};
  padding: ${({ theme }) => theme.spacing(2)};
`;

interface WarningProps {
  warningArray: ProtocolWarning[];
}
// The warning display function takes the warning object passed in and creates the elements/messages to be rendered
export const WarningDisplay = ({ warningArray }: WarningProps) => {
  const warningMsgs = [];
  let warningTotalCount = 0;
  let warningDisplayCount = 0;

  if (warningArray.length > 0) {
    warningTotalCount += warningArray.length;
    for (let x = 0; x < warningArray.length; x++) {
      let warningMsg = warningArray[x].message;
      if (warningArray[x].type === "SUM") {
        warningMsg = `All values in ${warningArray[x].message} are zero. Verify that this data is being mapped correctly.`;
      }
      if (warningArray[x].type === "CUMULATIVE") {
        warningMsg = `Cumulative value in field ${warningArray[x].message.split("++")[0]} dropped on ${toDate(
          parseFloat(warningArray[x].message.split("++")[1]),
        )}. Cumulative values should always increase.`;
      }
      if (warningArray[x].type === "TVL-") {
        warningMsg = `totalValueLockedUSD on ${warningArray[x].message} is below 1000. This is likely erroneous.`;
      }
      if (warningArray[x].type === "TVL+") {
        warningMsg = `totalValueLockedUSD on ${warningArray[x].message}
           is above 1,000,000,000,000. This is likely erroneous.`;
      }
      if (warningArray[x].type === "DEC") {
        const decInfo = warningArray[x].message.split("-");
        warningMsg = `Decimals on ${decInfo[1]} [ ${decInfo[2]} ] could not be pulled. The default decimal value of 18 has been applied.`;
      }
      warningDisplayCount += 1;
      warningMsgs.push(warningMsg);
    }
  }

  if (warningMsgs.length >= 1) {
    return (
      <StyledWarnings>
        <Typography variant="h5">
          DISPLAYING {warningDisplayCount} OUT OF {warningTotalCount} WARNINGS.
        </Typography>
        <ol>
          {warningMsgs.map((msg, i) => (
            <li key={i}>
              <Typography>{msg}</Typography>
            </li>
          ))}
        </ol>
      </StyledWarnings>
    );
  } else {
    return null;
  }
};

export default WarningDisplay;
