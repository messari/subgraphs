import { Versions as VersionsInterface } from "../../../deployment/context/interface";

export class VersionsClass implements VersionsInterface {
  getSchemaVersion(): string {
    return "1.3.0";
  }

  getSubgraphVersion(): string {
    return "1.2.2";
  }

  getMethodologyVersion(): string {
    return "1.1.0";
  }
}

export const Versions = new VersionsClass();
