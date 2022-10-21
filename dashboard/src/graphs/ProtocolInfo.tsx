import { styled } from "../styled";
import { Box, Chip, Link, Tooltip, Typography } from "@mui/material";
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
  protocolData: { [x: string]: any };
  protocolId: string;
  subgraphToQueryURL: string;
  schemaVersion: string;
  versionsJSON: { [x: string]: string };
}

// This component is for each individual subgraph
function ProtocolInfo({ protocolData, protocolId, subgraphToQueryURL, schemaVersion, versionsJSON }: ProtocolInfoProps) {
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

  let methodologyAlert: JSX.Element | null = null;
  if (!!versionsJSON?.methodology && !!protocolData?.protocols?.[0]?.methodologyVersion && versionsJSON?.methodology !== protocolData?.protocols?.[0]?.methodologyVersion) {
    methodologyAlert = (<span style={{ display: "inline-flex", alignItems: "center", padding: "0px 0px 0px 10px", fontSize: "10px" }}>
      <Tooltip title={`The methodology version in the deployment JSON (${versionsJSON?.methodology}) is different than the methodology version in the protocol entity (${protocolData?.protocols?.[0]?.methodologyVersion})`} placement="top" ><span style={{ padding: "4px 8px 2px 7px", borderRadius: "50%", backgroundColor: "red", cursor: "default", fontWeight: "800" }}>!</span></Tooltip>
    </span>);
  }

  let schemaAlert: JSX.Element | null = null;
  if (!!versionsJSON?.schema && !!protocolData?.protocols?.[0]?.schemaVersion && versionsJSON?.schema !== protocolData?.protocols?.[0]?.schemaVersion) {
    schemaAlert = (<span style={{ display: "inline-flex", alignItems: "center", padding: "0px 0px 0px 10px", fontSize: "10px" }}>
      <Tooltip title={`The schema version in the deployment JSON (${versionsJSON?.schema}) is different than the schema version in the protocol entity (${protocolData?.protocols?.[0]?.schemaVersion})`} placement="top" ><span style={{ padding: "4px 8px 2px 7px", borderRadius: "50%", backgroundColor: "red", cursor: "default", fontWeight: "800" }}>!</span></Tooltip>
    </span>);
  }

  let subgraphAlert: JSX.Element | null = null;
  if (!!versionsJSON?.subgraph && !!protocolData?.protocols?.[0]?.subgraphVersion && versionsJSON?.subgraph !== protocolData?.protocols?.[0]?.subgraphVersion) {
    subgraphAlert = (<span style={{ display: "inline-flex", alignItems: "center", padding: "0px 0px 0px 10px", fontSize: "10px" }}>
      <Tooltip title={`The subgraph version in the deployment JSON (${versionsJSON?.subgraph}) is different than the subgraph version in the protocol entity (${protocolData?.protocols?.[0]?.subgraphVersion})`} placement="top" ><span style={{ padding: "4px 8px 2px 7px", borderRadius: "50%", backgroundColor: "red", cursor: "default", fontWeight: "800" }}>!</span></Tooltip>
    </span>);
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
          {protocolSchemaData?.type && (
            <Chip label={<span>Type: {protocolSchemaData?.type}</span>} />
          )}
          {schemaVersion && (
            <Chip label={<span>Schema: {schemaVersion}{schemaAlert}</span>} />
          )}
          {protocolSchemaData?.subgraphVersion && !protocolSchemaData?.subgraphVersion.includes("N/A") ? (
            <Chip label={<span>Subgraph: {protocolSchemaData?.subgraphVersion}{subgraphAlert}</span>} />
          ) : null}
          {protocolSchemaData?.methodologyVersion && (
            <Chip label={<span>Methodology: {protocolSchemaData?.methodologyVersion}{methodologyAlert}</span>} />
          )}
        </ChipContainer>
      </Box>
      <CopyLinkToClipboard link={window.location.href} />
    </ProtocolContainer>
  );
}

export default ProtocolInfo;
