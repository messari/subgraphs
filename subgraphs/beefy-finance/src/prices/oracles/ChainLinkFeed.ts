import { Address } from "@graphprotocol/graph-ts";
import { CustomPriceType } from "../common/types";
import { ChainlinkOracle } from "../../../generated/ExampleVault/ChainlinkOracle";
import { polygonOracles as oracles } from "./oracles";
import { ERC20 } from "../../../generated/ExampleVault/ERC20";
import { ZERO_ADDRESS } from "../common/constants";

export function getChainLinkContract(
  asset: string,
  network: string
): ChainlinkOracle {
  for (let i = 0; i < oracles.length; i++) {
    if (oracles[i][0] === asset) {
      return ChainlinkOracle.bind(Address.fromString(oracles[i][1]));
    }
  }
  return ChainlinkOracle.bind(ZERO_ADDRESS);
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

  let result = chainLinkContract.try_getLatestRoundData(tokenAddr);

  if (!result.reverted) {
    const decimals = tokenContract.decimals();

    return CustomPriceType.initialize(
      result.value.value1.toBigDecimal(),
      decimals
    );
  }

  return new CustomPriceType();
}
