import { Subgraph } from "../../generated/schema";
import { SUBGRAPH_ID } from "../common/constants";
import { NetworkConfigs } from "../../configurations/configure";

export function getOrCreateSubgraph(): Subgraph {
  let subgraphMetadata = Subgraph.load(SUBGRAPH_ID);

  if (!subgraphMetadata) {
    subgraphMetadata = new Subgraph(SUBGRAPH_ID);
    subgraphMetadata.name = NetworkConfigs.getProtocolName();
    subgraphMetadata.slug = NetworkConfigs.getProtocolSlug();
    subgraphMetadata.schemaVersion = NetworkConfigs.getSchemaVersion();
    subgraphMetadata.subgraphVersion = NetworkConfigs.getSubgraphVersion();
    subgraphMetadata.methodologyVersion =
      NetworkConfigs.getMethodologyVersion();

    subgraphMetadata.save();
  }

  return subgraphMetadata;
}
