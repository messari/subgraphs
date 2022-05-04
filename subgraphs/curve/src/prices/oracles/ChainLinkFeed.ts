import * as constants from "../common/constants";
import { Address } from "@graphprotocol/graph-ts";
import { CustomPriceType } from "../common/types";
import { ChainLinkContract } from "../../../generated/MainRegistry/ChainLinkContract";
import { ChainLinkManual }  from "../../../generated/MainRegistry/ChainLinkManual";

export function getChainLinkContract(network: string): ChainLinkContract {
  return ChainLinkContract.bind(constants.CHAIN_LINK_CONTRACT_ADDRESS.get(network));
}

export function getChainLinkContractManual(network:string,tokenAddr:Address): ChainLinkManual {
  return ChainLinkManual.bind(constants.CHAIN_LINK_MANUAL_ADDRESS.get(network)!.get(tokenAddr.toHexString().toLowerCase())!);
}

export function getTokenPriceFromChainLink(tokenAddr: Address, network: string): CustomPriceType {
  let chainLinkContract = getChainLinkContract(network);

  if (!chainLinkContract) {
    return new CustomPriceType();
  }

  let result = chainLinkContract.try_latestRoundData(tokenAddr, constants.CHAIN_LINK_USD_ADDRESS);

  if (!result.reverted) {
    // value1 is the price of the token
    return CustomPriceType.initialize(result.value.value1.toBigDecimal());
  }

  let chainlink_address = constants.CHAIN_LINK_MANUAL_ADDRESS.get(tokenAddr.toHexString().toLowerCase())!
  if (!chainlink_address){
    return new CustomPriceType();
  }
  let chainLinkContractManual = getChainLinkContractManual(network,tokenAddr);
  let resultManual = chainLinkContractManual.try_latestAnswer();
  if (!result.reverted) {
    // value1 is the price of the token
    return CustomPriceType.initialize(resultManual.value.toBigDecimal());
  }
  return new CustomPriceType();
}
