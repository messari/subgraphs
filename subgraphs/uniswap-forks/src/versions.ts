import { Versions as VersionsInterface } from "../../../deployment/context/interface";

export class VersionsClass implements VersionsInterface {
  getSchemaVersion(): string {
    return "1.3.0";
  }

  getSubgraphVersion(): string {
    return "1.0.5";
  }

  getMethodologyVersion(): string {
    return "1.0.1";
  }
}

export const Versions = new VersionsClass();
