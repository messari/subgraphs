import * as constants from "../common/constants";
import { Address } from "@graphprotocol/graph-ts";
import { CustomPriceType } from "../common/types";
import { ChainLinkContract } from "../../../generated/UniswapV2Factory/ChainLinkContract";

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

  let result = chainLinkContract.try_latestRoundData(
    tokenAddr,
    constants.CHAIN_LINK_USD_ADDRESS
  );

  if (!result.reverted) {
    // value1 is the price of the token
    return CustomPriceType.initialize(result.value.value1.toBigDecimal());
  }

  return new CustomPriceType();
}
