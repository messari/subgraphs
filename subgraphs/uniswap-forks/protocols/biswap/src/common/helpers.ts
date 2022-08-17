import { BigInt } from "@graphprotocol/graph-ts";
import {
  LiquidityPool,
  _MasterChef,
  _MasterChefStakingPool,
  _MasterChefRewardsAlloc
} from "../../../../generated/schema";

export function getOrCreateMasterChefAlloc(
  masterChefType: string
): _MasterChefRewardsAlloc {
  let id = masterChefType;
  let masterChefAlloc = _MasterChefRewardsAlloc.load(id);

  if (!masterChefAlloc) {
    masterChefAlloc = new _MasterChefRewardsAlloc(id);
    masterChefAlloc.save();
  }

  return masterChefAlloc;
}
