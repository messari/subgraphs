import * as constants from "../common/constants";
import { Address, BigDecimal } from "@graphprotocol/graph-ts";
import { ChainLinkContract } from "../../../generated/templates/Vault/ChainLinkContract";

export function getChainLinkContract(network: string): ChainLinkContract {
  return ChainLinkContract.bind(
    Address.fromString(constants.CHAIN_LINK_CONTRACT_ADDRESS.get(network))
  );
}

export function getTokenPriceFromChainLink(
  tokenAddr: Address,
  network: string
): BigDecimal {
  const chainLinkContract = getChainLinkContract(network);

  if (!chainLinkContract) {
    return constants.BIGDECIMAL_ZERO;
  }

  let result = chainLinkContract.try_latestRoundData(
    tokenAddr,
    constants.CHAIN_LINK_USD_ADDRESS
  );

  if (!result.reverted) {
    // value1 is the price of the token
    return result.value.value1.toBigDecimal();
  }

  return constants.BIGDECIMAL_ZERO;
}
