import { DeploymentJsonContextInterface } from "../../deployment/context/interface";
import { DeploymentJsonContext as DeploymentJsonContextClass } from "../../deployment/context/class";

function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export const deploymentJsonContext: DeploymentJsonContextInterface = {
  protocolSlug: "aave-amm",
  protocolName: slugToTitle("aave-amm"),
  network: "ethereum",
  schemaVersion: "2.0.1",
  subgraphVersion: "1.2.15",
  methodologyVersion: "1.0.0",
};

export const DeploymentJsonContext = new DeploymentJsonContextClass(
  deploymentJsonContext
);
