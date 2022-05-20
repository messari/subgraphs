interface ProtocolInfoProps {
  protocolSchemaData: { [x: string]: any };
  subgraphToQueryURL: string;
  schemaVersion: string;
}

// This component is for each individual subgraph
function ProtocolInfo({ protocolSchemaData, subgraphToQueryURL, schemaVersion }: ProtocolInfoProps) {
  return (
    <div style={{ padding: "6px 24px" }}>
      <h3>
        {protocolSchemaData.protocols[0].name} - {protocolSchemaData.protocols[0].id}
      </h3>
      <p>
        <a href={subgraphToQueryURL}>Subgraph Query Endpoint - {subgraphToQueryURL}</a>
      </p>
      <p>Type - {protocolSchemaData.protocols[0].type}</p>
      <p>Schema Version - {schemaVersion}</p>
      <p>Subgraph Version - {protocolSchemaData?.protocols[0]?.subgraphVersion}</p>
      {protocolSchemaData?.protocols[0]?.methodologyVersion ? (
        <p>Methodology Version - {protocolSchemaData.protocols[0].methodologyVersion}</p>
      ) : null}
    </div>
  );
}

export default ProtocolInfo;
