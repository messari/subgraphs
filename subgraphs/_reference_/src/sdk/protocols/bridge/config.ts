import { Versions } from "../../../../../../deployment/context/interface";

import { ProtocolConfigurer } from "../config";
import { BridgePermissionType } from "./enums";

export interface BridgeConfigurer extends ProtocolConfigurer {
  getPermissionType(): BridgePermissionType;
}

export class BridgeConfig implements BridgeConfigurer {
  id: string;
  name: string;
  slug: string;
  versions: Versions;
  permissionType: BridgePermissionType;

  constructor(
    id: string,
    name: string,
    slug: string,
    permissionType: string,
    versions: Versions
  ) {
    this.id = id;
    this.name = name;
    this.slug = slug;
    this.versions = versions;
    this.permissionType = permissionType;
  }

  getID(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getSlug(): string {
    return this.slug;
  }

  getVersions(): Versions {
    return this.versions;
  }

  getPermissionType(): BridgePermissionType {
    return this.permissionType;
  }
}
