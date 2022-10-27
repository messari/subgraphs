import { Versions as VersionsInterface } from "../../../deployment/context/interface";

export class VersionsClass implements VersionsInterface {
  getSchemaVersion(): string {
    return "2.0.1";
  }

  getSubgraphVersion(): string {
    return "1.1.9";
  }

  getMethodologyVersion(): string {
    return "1.0.0";
  }
}

export const Versions = new VersionsClass();
