import { Versions } from "../../../../../deployment/context/interface";
import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Token } from "../../../generated/schema";

export interface ProtocolConfigurer {
  getID(): string;
  getName(): string;
  getSlug(): string;
  getVersions(): Versions;
}

export class ProtocolConfig implements ProtocolConfigurer {
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

export interface TokenPricer {
  getTokenPrice(token: Token): BigDecimal;
  getAmountValueUSD(token: Token, amount: BigInt): BigDecimal;
}
