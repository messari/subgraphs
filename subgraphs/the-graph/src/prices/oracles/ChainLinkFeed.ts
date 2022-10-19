import * as constants from "../common/constants";
import { Address } from "@graphprotocol/graph-ts";
import { CustomPriceType } from "../common/types";
import { ChainLinkContract } from "../../../generated/Staking/ChainLinkContract";

export function getChainLinkContract(network: string): ChainLinkContract {
  return ChainLinkContract.bind(
    constants.CHAIN_LINK_CONTRACT_ADDRESS.get(network)
  );
}

export function getTokenPriceFromChainLink(
  tokenAddr: Address,
  network: string
): CustomPriceType {
  const chainLinkContract = getChainLinkContract(network);

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
      new CustomPriceType();
    }

    return CustomPriceType.initialize(
      result.value.value1.toBigDecimal(),
      decimals.value
    );
  }

  return new CustomPriceType();
}
