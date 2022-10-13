import { DeploymentJsonContextInterface } from "../../deployment/context/interface";
import { DeploymentJsonContext as DeploymentJsonContextClass } from "../../deployment/context/class";

function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export const deploymentJsonContext: DeploymentJsonContextInterface = {
  protocolSlug: "the-graph",
  protocolName: slugToTitle("the-graph"),
  network: "ethereum",
  schemaVersion: "1.0.0",
  subgraphVersion: "1.0.0",
  methodologyVersion: "1.0.0",
};

export const DeploymentJsonContext = new DeploymentJsonContextClass(
  deploymentJsonContext
);
