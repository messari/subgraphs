import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { Address } from "@graphprotocol/graph-ts";
import { CustomPriceType } from "../common/types";
import { ChainLinkContract } from "../../../generated/LPStaking/ChainLinkContract";

export function getChainLinkContract(): ChainLinkContract | null {
  const config = utils.getConfig();
  if (!config || utils.isNullAddress(config.chainLink())) return null;

  return ChainLinkContract.bind(config.chainLink());
}

export function getTokenPriceUSDC(tokenAddr: Address): CustomPriceType {
  const chainLinkContract = getChainLinkContract();

  if (!chainLinkContract) {
    return new CustomPriceType();
  }

  const result = chainLinkContract.try_latestRoundData(
    tokenAddr,
    constants.CHAIN_LINK_USD_ADDRESS
  );

  if (!result.reverted) {
    const decimals = chainLinkContract.try_decimals(
      tokenAddr,
      constants.CHAIN_LINK_USD_ADDRESS
    );

    if (decimals.reverted) {
      return new CustomPriceType();
    }

    return CustomPriceType.initialize(
      result.value.value1.toBigDecimal(),
      decimals.value
    );
  }

  return new CustomPriceType();
}
