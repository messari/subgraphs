import { DeploymentJsonContextInterface } from "../../deployment/context/interface";
import { DeploymentJsonContext as DeploymentJsonContextClass } from "../../deployment/context/class";

function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export const deploymentJsonContext: DeploymentJsonContextInterface = {
  protocolSlug: "apeswap",
  protocolName: slugToTitle("apeswap"),
  network: "bsc",
  schemaVersion: "1.3.0",
  subgraphVersion: "1.1.7",
  methodologyVersion: "1.0.0",
};

export const DeploymentJsonContext = new DeploymentJsonContextClass(
  deploymentJsonContext
);
