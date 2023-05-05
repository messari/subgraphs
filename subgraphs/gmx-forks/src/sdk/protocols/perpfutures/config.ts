import { ProtocolConfigurer } from "../config";
import { Versions } from "../../../../../../deployment/context/interface";

export class PerpetualConfig implements ProtocolConfigurer {
  id: string;
  name: string;
  slug: string;
  versions: Versions;

  constructor(id: string, name: string, slug: string, versions: Versions) {
    this.id = id;
    this.name = name;
    this.slug = slug;
    this.versions = versions;
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
}
