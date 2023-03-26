import { Address, Bytes, ethereum, log } from "@graphprotocol/graph-ts";
import { BondingManager } from "../../generated/BondingManager/BondingManager";
import * as constants from "../common/constants";
// Import entity types generated from the GraphQL schema
import * as utils from "../common/utils";
export function createOrUpdatePool(
  poolAddress: Address,
  event: ethereum.Event
): void {
  log.warning("[createPool] start poolAddress {}", [poolAddress.toHexString()]);
  if (poolAddress.equals(constants.NULL.TYPE_ADDRESS)) return;

  const sdk = utils.initializeSDK(event);
  const bondingManagerContract = BondingManager.bind(
    constants.BONDING_MANAGER_ADDRESS
  );

  let protocolTvl = utils.readValue(
    bondingManagerContract.try_currentRoundTotalActiveStake(),
    constants.BIGINT_ZERO
  );

  if (protocolTvl.equals(constants.BIGINT_ZERO))
    protocolTvl = utils.readValue(
      bondingManagerContract.try_nextRoundTotalActiveStake(),
      constants.BIGINT_ZERO
    );

  const poolTvl = utils.readValue(
    bondingManagerContract.try_transcoderTotalStake(poolAddress),
    constants.BIGINT_ZERO
  );
  const poolId = Bytes.fromUTF8(poolAddress.toHexString());

  const LPT = sdk.Tokens.getOrCreateToken(constants.LPT_ADDRESS);
  const pool = sdk.Pools.loadPool(poolId);
  pool.initialize(
    "",
    "",
    [Bytes.fromHexString(constants.LPT_ADDRESS.toHexString())],
    null,
    false
  );

  pool.setInputTokenBalance([poolTvl], true);
  let rewardTokenEmission = constants.BIGDECIMAL_HUNDRED;
  if (!protocolTvl.equals(constants.BIGINT_ZERO))
    rewardTokenEmission = utils
      .bigIntToBigDecimal(poolTvl, 18)
      .div(utils.bigIntToBigDecimal(protocolTvl, 18))
      .times(utils.getTotalRewardTokens());
  pool.setRewardEmissions(
    constants.RewardTokenType.DEPOSIT,
    LPT,
    rewardTokenEmission.digits
  );
  log.warning("[createPool] end poolAddress {}", [poolAddress.toHexString()]);
}
