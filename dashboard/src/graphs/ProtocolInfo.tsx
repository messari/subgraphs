import { styled } from "../styled";
import { Box, Chip, Link, Typography } from "@mui/material";
import { CopyLinkToClipboard } from "../common/utilComponents/CopyLinkToClipboard";

const ProtocolContainer = styled("div")`
  background: rgba(32, 37, 44, 1);
  padding: ${({ theme }) => theme.spacing(2, 3, 3, 3)};
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
`;

const ChipContainer = styled("div")`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(2)};
  margin-top: ${({ theme }) => theme.spacing(1)};
`;

interface ProtocolInfoProps {
  protocolSchemaData: { [x: string]: any };
  subgraphToQueryURL: string;
  schemaVersion: string;
}

// This component is for each individual subgraph
function ProtocolInfo({ protocolSchemaData, subgraphToQueryURL, schemaVersion }: ProtocolInfoProps) {
  return (
    <ProtocolContainer>
      <Box>
        <Link href={subgraphToQueryURL} target="_blank">
          <Typography variant="h6">
            <span>{protocolSchemaData.protocols[0].name} - </span>
            <Typography variant="body1" component="span">
              {protocolSchemaData.protocols[0].network}
            </Typography>
          </Typography>
        </Link>
        <Typography variant="caption">{protocolSchemaData.protocols[0].id}</Typography>
        <ChipContainer>
          <Chip label={protocolSchemaData.protocols[0].type} />
          <Chip label={`Schema: ${schemaVersion}`} />
          <Chip label={`Subgraph: ${protocolSchemaData?.protocols[0]?.subgraphVersion}`} />
          {protocolSchemaData?.protocols[0]?.methodologyVersion && (
            <Chip label={`Methodology: ${protocolSchemaData.protocols[0].methodologyVersion}`} />
          )}
        </ChipContainer>
      </Box>
      <CopyLinkToClipboard link={window.location.href} />
    </ProtocolContainer>
  );
}

export default ProtocolInfo;
