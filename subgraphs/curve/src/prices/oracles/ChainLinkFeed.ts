import * as constants from "../common/constants";
import { Address, log, BigInt } from "@graphprotocol/graph-ts";
import { CustomPriceType } from "../common/types";
import { ChainLinkContract } from "../../../generated/MainRegistry/ChainLinkContract";
import { ChainLinkManual }  from "../../../generated/MainRegistry/ChainLinkManual";
import { bigIntToBigDecimal } from "../../common/utils/numbers";

export function getChainLinkContract(network: string): ChainLinkContract {
  return ChainLinkContract.bind(constants.CHAIN_LINK_CONTRACT_ADDRESS.get(network));
}

export function getChainLinkContractManualAddress(network:string,tokenAddr:Address): ChainLinkManual {
  log.warning("Fetching chainlink manual addr",[]);
  let mainnet_chainlink_addresses = constants.CHAIN_LINK_MANUAL_ADDRESS.get(network);
  log.warning("Fetching chainlink manual addr",[]);
  return ChainLinkManual.bind(mainnet_chainlink_addresses!.get(tokenAddr)!)
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
  if (network === "mainnet" && tokenAddr === constants.WHITELIST_TOKENS_MAINNET.get("WETH")! || tokenAddr === constants.WHITELIST_TOKENS_MAINNET.get("WBTC")!) {
    let chainLinkContractManual = getChainLinkContractManualAddress(network,tokenAddr);
    let resultManual = chainLinkContractManual.try_latestAnswer();
    if (!result.reverted) {
      // value1 is the price of the token
      return CustomPriceType.initialize(bigIntToBigDecimal(resultManual.value,8));
    }
  }
  return new CustomPriceType();
}
