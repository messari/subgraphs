import ProtocolInfo from "./ProtocolInfo";
import { Link as RouterLink } from "react-router-dom";
import { styled } from "../../styled";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import { Box, Link } from "@mui/material";

const BackBanner = styled("div")`
  display: flex;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(1)};
  padding: ${({ theme }) => theme.spacing(2)};
  background: #38404a;
`;

interface DashboardHeaderProps {
  protocolData: Record<string, any> | undefined;
  protocolId: string;
  subgraphToQueryURL: string;
  schemaVersion: string;
  versionsJSON: { [x: string]: string };
}

export const DashboardHeader = ({
  protocolData,
  protocolId,
  subgraphToQueryURL,
  schemaVersion,
  versionsJSON
}: DashboardHeaderProps) => {
  return (
    <div>
      <BackBanner>
        <Box display="flex" alignItems="center">
          <ChevronLeftIcon />
          <Link component={RouterLink} to="/">
            Back to Deployments
          </Link>
        </Box>
        <a href="https://github.com/messari/subgraphs" target="_blank" style={{ color: "white" }} rel="noreferrer">
          powered by Messari Subgraphs
        </a>
      </BackBanner>
      {protocolData && (
        <ProtocolInfo
          protocolData={protocolData}
          protocolId={protocolId}
          subgraphToQueryURL={subgraphToQueryURL}
          schemaVersion={schemaVersion}
          versionsJSON={versionsJSON}
        />
      )}
    </div>
  );
};
