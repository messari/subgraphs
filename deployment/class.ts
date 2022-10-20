import { DeploymentJsonContextInterface } from "./interface";

export class DeploymentJsonContext implements DeploymentJsonContextInterface {
  protocolSlug: string;
  protocolName: string;
  network: string;
  schemaVersion: string;
  subgraphVersion: string;
  methodologyVersion: string;

  constructor(deployJsonContext: DeploymentJsonContextInterface) {
    this.protocolSlug = deployJsonContext.protocolSlug;
    this.protocolName = deployJsonContext.protocolName;
    this.network = deployJsonContext.network;
    this.schemaVersion = deployJsonContext.schemaVersion;
    this.subgraphVersion = deployJsonContext.subgraphVersion;
    this.methodologyVersion = deployJsonContext.methodologyVersion;
  }

  getProtocolSlug(): string {
    return this.protocolSlug;
  }

  getProtocolName(): string {
    return this.protocolName;
  }

  getNetwork(): string {
    return this.network;
  }

  getSchemaVersion(): string {
    return this.schemaVersion;
  }

  getSubgraphVersion(): string {
    return this.subgraphVersion;
  }

  getMethodologyVersion(): string {
    return this.methodologyVersion;
  }
}

// convert slug to title
//
// @param {string} slug
// @return {string}
//
export function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
