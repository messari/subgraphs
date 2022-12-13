import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Token } from "../../generated/schema";

export interface Configurations {
  getNetwork(): string;
  getProtocolName(): string;
  getProtocolSlug(): string;
  getFactoryAddress(): string;
  getChainID(): BigInt;
  getCrosschainID(tokenID: string): BigInt;
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
