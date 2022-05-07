import * as constants from "../common/constants";
import { Address, log } from "@graphprotocol/graph-ts";
import { CustomPriceType } from "../common/types";
import { ChainLinkContract } from "../../../generated/MainRegistry/ChainLinkContract";
import { ChainLinkManual }  from "../../../generated/MainRegistry/ChainLinkManual";
import { bigIntToBigDecimal } from "../../common/utils/numbers";

export function getChainLinkContract(network: string): ChainLinkContract {
  return ChainLinkContract.bind(constants.CHAIN_LINK_CONTRACT_ADDRESS.get(network));
}

export function getChainLinkContractManualAddress(network:string,tokenAddr:Address): ChainLinkManual {
  let manualAddressMap = constants.CHAIN_LINK_MANUAL_ADDRESS.get(network)!
  if (manualAddressMap.has(tokenAddr.toHexString().toLowerCase())) {
    log.error('getChainLinkContractManualAddress manual address found for {}', [tokenAddr.toHexString().toLowerCase()])
    return ChainLinkManual.bind(manualAddressMap.get(tokenAddr.toHexString()));
  }
  return ChainLinkManual.bind(constants.ZERO_ADDRESS);
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
  let chainLinkContractManual = getChainLinkContractManualAddress(network,tokenAddr);
  if (!chainLinkContractManual) {
    return new CustomPriceType();
  }
  let resultManual = chainLinkContractManual.try_latestAnswer();
  if (!result.reverted) {
    return CustomPriceType.initialize(bigIntToBigDecimal(resultManual.value,8));
  }
  return new CustomPriceType();
}
