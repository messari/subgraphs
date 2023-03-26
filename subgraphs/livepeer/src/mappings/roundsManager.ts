import { Bytes, log } from "@graphprotocol/graph-ts";
import { BondingManager } from "../../generated/BondingManager/BondingManager";
// Import event types from the registrar contract ABIs
import {
  NewRound,
  ParameterUpdate,
} from "../../generated/RoundsManager/RoundsManager";
import * as constants from "../common/constants";
// Import entity types generated from the GraphQL schema
import * as utils from "../common/utils";

export function newRound(event: NewRound): void {
  // const currentRound = event.params.round;
  // const sdk = utils.initializeSDK(event);
  // const bondingManagerContract = BondingManager.bind(constants.BONDING_MANAGER_ADDRESS);
  // const protocolTvl = utils.readValue(
  //   bondingManagerContract.try_currentRoundTotalActiveStake(),
  //   constants.BIGINT_ZERO
  // );
  // let currentTranscoder = utils.readValue(bondingManagerContract.try_getFirstTranscoderInPool(), constants.NULL.TYPE_ADDRESS);
  // while (!currentTranscoder.equals(constants.NULL.TYPE_ADDRESS)) {
  //     const poolId = Bytes.fromUTF8(currentTranscoder.toHexString());
  //   const LPT = sdk.Tokens.getOrCreateToken(constants.LPT_ADDRESS);
  //   sdk.Tokens.getOrCreateRewardToken(constants.RewardTokenType.DEPOSIT, LPT);
  //   sdk.Pools.loadPool(poolId).initialize("", "", [Bytes.fromHexString(constants.LPT_ADDRESS.toHexString())], null, false);
  //   const poolTvl = utils.readValue(bondingManagerContract.try_transcoderTotalStake(currentTranscoder), constants.BIGINT_ZERO);
  //   sdk.Pools.loadPool(poolId).setInputTokenBalance([poolTvl], true);
  //   const rewardTokenEmission = (utils.bigIntToBigDecimal(poolTvl, 18).div(utils.bigIntToBigDecimal(protocolTvl, 18))).times(utils.getTotalRewardTokens()).digits.times(constants.BIGINT_TEN.pow(18));
  //   sdk.Pools.loadPool(poolId).setRewardEmissions(constants.RewardTokenType.DEPOSIT, LPT,rewardTokenEmission);
  //     currentTranscoder = utils.readValue(
  //       bondingManagerContract.try_getNextTranscoderInPool(currentTranscoder),
  //       constants.NULL.TYPE_ADDRESS
  //     );
  // }
  // log.warning("[NewRound] roundId {}", [currentRound.toString()]);
  //Get round id
  //Get first transcoder in round
  //Create a pool using {transcoder - round}
  //Set total value locked and other pool parameters
  //Loop through all the transcoders for the round
}

export function parameterUpdate(event: ParameterUpdate): void {}
