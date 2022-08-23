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
  const subgraphNameString = subgraphToQueryURL.split("name/")[1];
  const href = new URL(window.location.href);
  const p = new URLSearchParams(href.search);
  const versionParam = p.get("version");
  const nameParam = p.get("name");

  let link = "";
  if (subgraphNameString || nameParam) {
    link = "https://thegraph.com/hosted-service/subgraph/" + (subgraphNameString || nameParam);
    if (versionParam === "pending") {
      link += "?version=pending";
    }
  } else if (subgraphToQueryURL.includes("https://gateway.thegraph.com")) {
    const subId = subgraphToQueryURL.split("id/")[1];
    link = `https://thegraph.com/explorer/subgraph?id=${subId}&view=Overview`;
  } else {
    link = subgraphToQueryURL;
  }

  if (protocolData.protocols?.length > 1) {
    const findProto = protocolData.protocols?.find((pro: any) => pro?.id === protocolId);
    if (findProto) {
      protocolSchemaData = findProto;
    }
  }
  return (
    <ProtocolContainer>
      <Box>
        <Link href={link} target="_blank">
          <Typography variant="h6">
            <span>{protocolSchemaData?.name} - </span>
            <Typography variant="body1" component="span">
              {protocolSchemaData?.network}
              {subgraphToQueryURL.includes("https://gateway.thegraph.com") ? " (DECENTRALIZED NETWORK)" : ""}
            </Typography>
          </Typography>
        </Link>
        <Typography variant="caption">{protocolSchemaData?.id}</Typography>
        <ChipContainer>
          <Chip label={`Type: ${protocolSchemaData?.type}`} />
          <Chip label={`Schema: ${schemaVersion || "N/A"}`} />
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
