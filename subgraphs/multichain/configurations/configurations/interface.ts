import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Token } from "../../generated/schema";

export interface Configurations {
  getNetwork(): string;
  getProtocolName(): string;
  getProtocolSlug(): string;
  getFactoryAddress(): string;
  getChainID(): BigInt;
  getCrosschainID(tokenID: string): BigInt;
  isWhitelistToken(tokenAddress: Address, crosschainID: string): boolean;
  getCrosschainTokenAddress(
    bridgeType: string,
    tokenID: string,
    crosschainID: string
  ): Address;
  getBridgeFeeUSD(
    bridgeType: string,
    token: Token,
    crosschainID: string,
    amount: BigInt
  ): BigDecimal;
}
