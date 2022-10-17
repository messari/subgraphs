import { Address, BigInt } from "@graphprotocol/graph-ts";

// Initialize a Token Definition with the attributes
export class StaticTokenDefinition {
  address: Address;
  symbol: string;
  name: string;
  decimals: BigInt;

  // Initialize a Token Definition with its attributes
  constructor(address: Address, symbol: string, name: string, decimals: BigInt) {
    this.address = address;
    this.symbol = symbol;
    this.name = name;
    this.decimals = decimals;
  }

  // Get all tokens with a static defintion
  static getStaticDefinitions(): Array<StaticTokenDefinition> {
    const staticDefinitions = new Array<StaticTokenDefinition>(6);

    // Add DGD
    const tokenDGD = new StaticTokenDefinition(
      Address.fromString("0xe0b7927c4af23765cb51314a0e0521a9645f0e2a"),
      "DGD",
      "DGD",
      BigInt.fromI32(9),
    );
    staticDefinitions.push(tokenDGD);

    // Add AAVE
    const tokenAAVE = new StaticTokenDefinition(
      Address.fromString("0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9"),
      "AAVE",
      "Aave Token",
      BigInt.fromI32(18),
    );
    staticDefinitions.push(tokenAAVE);

    // Add LIF
    const tokenLIF = new StaticTokenDefinition(
      Address.fromString("0xeb9951021698b42e4399f9cbb6267aa35f82d59d"),
      "LIF",
      "Lif",
      BigInt.fromI32(18),
    );
    staticDefinitions.push(tokenLIF);

    // Add SVD
    const tokenSVD = new StaticTokenDefinition(
      Address.fromString("0xbdeb4b83251fb146687fa19d1c660f99411eefe3"),
      "SVD",
      "savedroid",
      BigInt.fromI32(18),
    );
    staticDefinitions.push(tokenSVD);

    // Add TheDAO
    const tokenTheDAO = new StaticTokenDefinition(
      Address.fromString("0xbb9bc244d798123fde783fcc1c72d3bb8c189413"),
      "TheDAO",
      "TheDAO",
      BigInt.fromI32(16),
    );
    staticDefinitions.push(tokenTheDAO);

    // Add HPB
    const tokenHPB = new StaticTokenDefinition(
      Address.fromString("0x38c6a68304cdefb9bec48bbfaaba5c5b47818bb2"),
      "HPB",
      "HPBCoin",
      BigInt.fromI32(18),
    );
    staticDefinitions.push(tokenHPB);

    return staticDefinitions;
  }

  // Helper for hardcoded tokens
  static fromAddress(tokenAddress: Address): StaticTokenDefinition | null {
    const staticDefinitions = this.getStaticDefinitions();
    const tokenAddressHex = tokenAddress.toHexString();

    // Search the definition using the address
    for (let i = 0; i < staticDefinitions.length; i++) {
      const staticDefinition = staticDefinitions[i];
      if (staticDefinition.address.toHexString() == tokenAddressHex) {
        return staticDefinition;
      }
    }

    // If not found, return null
    return null;
  }
}
