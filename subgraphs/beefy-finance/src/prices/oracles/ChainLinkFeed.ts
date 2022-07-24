import { Address } from "@graphprotocol/graph-ts";
import { CustomPriceType } from "../common/types";
import { ChainLinkContract } from "../../../generated/aave-aave-eol/ChainLinkContract";
import { polygonOracles as oracles } from "./oracles";
import { ERC20 } from "../../../generated/aave-aave-eol/ERC20";
import { ZERO_ADDRESS } from "../common/constants";
import { CHAIN_LINK_USD_ADDRESS } from "../common/constants";

export function getChainLinkContract(
  asset: string,
  network: string
): ChainLinkContract {
  for (let i = 0; i < oracles.length; i++) {
    if (oracles[i][0] === asset) {
      return ChainLinkContract.bind(Address.fromString(oracles[i][1]));
    }
  }
  return ChainLinkContract.bind(ZERO_ADDRESS);
}

export function getTokenPriceFromChainLink(
  tokenAddr: Address,
  network: string
): CustomPriceType {
  const tokenContract = ERC20.bind(tokenAddr);
  const symbol = tokenContract.symbol();
  const chainLinkContract = getChainLinkContract(symbol, network);

  if (chainLinkContract._address === ZERO_ADDRESS) {
    return new CustomPriceType();
  }

  let result = chainLinkContract.try_latestRoundData(tokenAddr, CHAIN_LINK_USD_ADDRESS);

  if (!result.reverted) {
    const decimals = tokenContract.decimals();

    return CustomPriceType.initialize(
      result.value.value1.toBigDecimal(),
      decimals
    );
  }

  return new CustomPriceType();
}
