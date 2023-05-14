import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { CustomPriceType } from "../common/types";
import { Address, ethereum } from "@graphprotocol/graph-ts";
import { ChainLinkContract } from "../../../generated/templates/MlpManagerTemplate/ChainLinkContract";

export function getTokenPriceUSDC(
  tokenAddr: Address,
  block: ethereum.Block | null = null
): CustomPriceType {
  const config = utils.getConfig();
  const contractAddress = utils.getContract(config.chainLink(), block);

  if (!contractAddress) return new CustomPriceType();

  const chainLinkContract = ChainLinkContract.bind(contractAddress);
  const result = chainLinkContract.try_latestRoundData(
    tokenAddr,
    constants.CHAIN_LINK_USD_ADDRESS
  );

  if (!result.reverted) {
    const decimals = utils.readValue<i32>(
      chainLinkContract.try_decimals(
        tokenAddr,
        constants.CHAIN_LINK_USD_ADDRESS
      ),
      constants.DEFAULT_USDC_DECIMALS
    );

    return CustomPriceType.initialize(
      result.value.value1.toBigDecimal(),
      decimals,
      constants.OracleType.CHAINLINK_FEED
    );
  }

  return new CustomPriceType();
}
