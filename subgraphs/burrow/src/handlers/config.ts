import { getOrCreateToken } from "../helpers/token";

import { getOrCreateProtocol } from "../helpers/protocol";
import { EventData } from "../utils/type";

export function handleNew(event: EventData): void {
  const data = event.data;
  const controller = getOrCreateProtocol();
  const eventArgsArr = data.get("config");
  if (!eventArgsArr) return;
  const eventArgs = eventArgsArr.toObject();
  /* -------------------------------------------------------------------------- */
  /*                                   Oracle                                   */
  /* -------------------------------------------------------------------------- */
  const oracle = eventArgs.get("oracle_account_id");
  if (!oracle) return;
  /* -------------------------------------------------------------------------- */
  /*                                    Owner                                   */
  /* -------------------------------------------------------------------------- */
  const owner = eventArgs.get("owner_id");
  if (!owner) return;
  /* -------------------------------------------------------------------------- */
  /*                                  _booster                                  */
  /* -------------------------------------------------------------------------- */
  const booster = eventArgs.get("booster_token_id");
  if (!booster) return;
  const booster_decimals = eventArgs.get("booster_decimals");
  if (!booster_decimals) return;
  const multiplier = eventArgs.get(
    "x_booster_multiplier_at_maximum_staking_duration"
  );
  if (!multiplier) return;
  /* -------------------------------------------------------------------------- */
  /*                                  max assets                                */
  /* -------------------------------------------------------------------------- */
  const max_num_assets = eventArgs.get("max_num_assets");
  if (!max_num_assets) return;

  controller._oracle = oracle.toString();
  controller._owner = owner.toString();

  const boosterToken = getOrCreateToken(booster.toString());
  controller._booster = boosterToken.id;
  boosterToken.decimals = booster_decimals.toI64() as i32;

  controller._boosterMultiplier = multiplier.toBigInt();
  controller._maxAssets = max_num_assets.data as i32;
  controller.save();
}
