import { Address, BigInt } from "@graphprotocol/graph-ts";
import { ChainLinkContract } from "../../../generated/bveCVX/ChainLinkContract";
import * as constants from "../common/constants";
import { CustomPriceType } from "../common/types";

export function getChainLinkContract(network: string): ChainLinkContract {
  return ChainLinkContract.bind(constants.CHAIN_LINK_CONTRACT_ADDRESS.get(network));
}

export function getTokenPriceFromChainLink(tokenAddr: Address, network: string): CustomPriceType {
  const chainLinkContract = getChainLinkContract(network);

  if (!chainLinkContract) {
    return new CustomPriceType();
  }

  let result = chainLinkContract.try_latestRoundData(tokenAddr, constants.CHAIN_LINK_USD_ADDRESS);

  if (!result.reverted) {
    let decimals = chainLinkContract.try_decimals(tokenAddr, constants.CHAIN_LINK_USD_ADDRESS);

    if (!decimals.reverted) {
      // value1 is the price of the token
      return CustomPriceType.initialize(
        result.value.value1.toBigDecimal(),
        BigInt.fromI32(decimals.value as u8),
      );
    }
  }

  return new CustomPriceType();
}
