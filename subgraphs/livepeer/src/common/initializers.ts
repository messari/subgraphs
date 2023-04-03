import {
  TokenInitialize,
  TokenPrice,
  getTotalRewardTokens,
} from "../modules/Tokens";
import { Versions } from "../versions";
import * as utils from "../common/utils";
import { SDK } from "../sdk/protocols/generic";
import * as constants from "../common/constants";
import { CustomEventType } from "../sdk/util/events";
import { ProtocolConfig } from "../sdk/protocols/config";
import { Address, Bytes, ethereum } from "@graphprotocol/graph-ts";
import { BondingManager } from "../../generated/BondingManager/BondingManager";

export function createOrUpdatePool(
  poolAddress: Address,
  event: ethereum.Event
): void {
  if (poolAddress.equals(constants.NULL.TYPE_ADDRESS)) return;

  const sdk = initializeSDK(event);
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
  let rewardTokenEmission = constants.BIGINT_ZERO;
  if (!protocolTvl.equals(constants.BIGINT_ZERO))
    rewardTokenEmission = poolTvl
      .times(getTotalRewardTokens())
      .div(protocolTvl);
  pool.setRewardEmissions(
    constants.RewardTokenType.DEPOSIT,
    LPT,
    rewardTokenEmission
  );
}

export function initializeSDK(event: ethereum.Event): SDK {
  const protocolConfig = new ProtocolConfig(
    constants.PROTOCOL_ID,
    constants.PROTOCOL_NAME,
    constants.PROTOCOL_SLUG,
    Versions
  );
  const tokenPricer = new TokenPrice();
  const tokenInitializer = new TokenInitialize();
  const customEvent = CustomEventType.initialize(
    event.block,
    event.transaction,
    event.logIndex,
    event
  );
  const sdk = new SDK(
    protocolConfig,
    tokenPricer,
    tokenInitializer,
    customEvent
  );

  return sdk;
}
