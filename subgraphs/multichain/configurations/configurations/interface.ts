import { Address, BigDecimal, BigInt, TypedMap } from "@graphprotocol/graph-ts";
import { Token } from "../../generated/schema";

export interface Configurations {
  getNetwork(): string;
  getProtocolName(): string;
  getProtocolSlug(): string;
  getFactoryAddress(): string;
  getChainID(): BigInt;
  getCrosschainTokenAddress(token: Token, crosschainID: string): Address;
  getCrosschainTokenType(token: Token, crosschainID: string): string;
  getBridgeFeeUSD(
    amount: BigInt,
    token: Token,
    crosschainID: string
  ): BigDecimal;
}
