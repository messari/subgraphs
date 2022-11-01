import { Versions as VersionsInterface } from "../../../deployment/context/interface";

export class VersionsClass implements VersionsInterface {
  getSchemaVersion(): string {
    return "1.0.0";
  }

  getSubgraphVersion(): string {
    return "1.0.0";
  }

  getMethodologyVersion(): string {
    return "1.0.0";
  }
}

export const Versions = new VersionsClass();
