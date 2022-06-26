import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { CustomFeesType } from "../common/types";
import { BigInt } from "@graphprotocol/graph-ts";
import { Booster as BoosterContract } from "../../generated/Booster/Booster";

export function getTotalFees(): CustomFeesType {
  const contract = BoosterContract.bind(constants.CONVEX_BOOSTER_ADDRESS);

  const lockIncentive = utils.readValue<BigInt>(
    contract.try_lockIncentive(),
    constants.BIGINT_ZERO
  );
  const callIncentive = utils.readValue<BigInt>(
    contract.try_earmarkIncentive(),
    constants.BIGINT_ZERO
  );
  const stakerIncentive = utils.readValue<BigInt>(
    contract.try_stakerIncentive(),
    constants.BIGINT_ZERO
  );
  const platformFee = utils.readValue<BigInt>(
    contract.try_platformFee(),
    constants.BIGINT_ZERO
  );

  return new CustomFeesType(
    lockIncentive,
    callIncentive,
    stakerIncentive,
    platformFee
  );
}
