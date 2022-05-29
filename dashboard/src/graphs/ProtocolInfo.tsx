import { styled } from "../styled";
import { Box, Chip, Link, Typography } from "@mui/material";
import { CopyLinkToClipboard } from "../common/utilComponents/CopyLinkToClipboard";
import { ProtocolTypeEntityName, ProtocolTypeEntityNames } from "../constants";

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
  protocolData: { [x: string]: any };
  protocolId: string;
  subgraphToQueryURL: string;
  schemaVersion: string;
}

// This component is for each individual subgraph
function ProtocolInfo({ protocolData, protocolId, subgraphToQueryURL, schemaVersion }: ProtocolInfoProps) {
  let protocolSchemaData = protocolData.protocols[0];
  if (protocolData.protocols?.length > 1) {
    const findProto = protocolData.protocols?.find((pro: any) => pro?.id === protocolId);
    if (findProto) {
      protocolSchemaData = findProto;
    }
  }
  return (
    <ProtocolContainer>
      <Box>
        <Link href={subgraphToQueryURL} target="_blank">
          <Typography variant="h6">
            <span>{protocolSchemaData?.name} - </span>
            <Typography variant="body1" component="span">
              {protocolSchemaData?.network}
            </Typography>
          </Typography>
        </Link>
        <Typography variant="caption">{protocolSchemaData?.id}</Typography>
        <ChipContainer>
          <Chip label={protocolSchemaData?.type} />
          <Chip label={`Schema: ${schemaVersion}`} />
          <Chip label={`Subgraph: ${protocolSchemaData?.subgraphVersion}`} />
          {protocolSchemaData?.methodologyVersion && (
            <Chip label={`Methodology: ${protocolSchemaData?.methodologyVersion}`} />
          )}
        </ChipContainer>
      </Box>
      <CopyLinkToClipboard link={window.location.href} />
    </ProtocolContainer>
  );
}

export default ProtocolInfo;
