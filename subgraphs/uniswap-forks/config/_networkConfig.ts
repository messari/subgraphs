import { Address, dataSource, log } from "@graphprotocol/graph-ts";
import { _PROTOCOL_SLUG } from "./_configConstants/slug";
import { _FACTORY_ADDRESS } from "./_configConstants/factories";
import { _TRADING_FEE, _PROTOCOL_FEE_TO_ON, _PROTOCOL_FEE_TO_OFF, _LP_FEE_TO_ON, _LP_FEE_TO_OFF, _FEE_SWITCH } from "./_configConstants/fees";
import { _REWARD_INTERVAL } from "./_configConstants/rewardInterval";
import { _STABLE_POOLS } from "./_configConstants/stablePools";
import { _REWARD_TOKEN } from "./_configConstants/tokens/rewards";
import { _STABLE_COINS } from "./_configConstants/tokens/stables";
import { _REFERENCE_TOKEN } from "./_configConstants/tokens/reference";
import { _UNTRACKED_PAIRS } from "./_configConstants/tokens/untracked";
import { _WHITELISTS } from "./_configConstants/tokens/whitelists";
import { Protocol } from "../src/common/constants";
import { toBytesArray } from "../src/common/utils/utils";
import { Factory } from "../generated/Factory/Factory";

// Choose which protocol you are indexing. The deployed network will already be determined
let PROTOCOL_NAME_TEMP = Protocol.UNISWAP_V2;

export namespace NetworkConfigs {
  export const NETWORK = dataSource.network().toUpperCase();

  export const PROTOCOL_NAME = PROTOCOL_NAME_TEMP;
  export const PROTOCOL_SLUG = _PROTOCOL_SLUG[PROTOCOL_NAME];
  
  export const FACTORY_ADDRESS = _FACTORY_ADDRESS[PROTOCOL_NAME][NETWORK];
  export const FACTORY_CONTRACT = Factory.bind(Address.fromString(FACTORY_ADDRESS));

  export const TRADING_FEE = _TRADING_FEE[PROTOCOL_NAME][NETWORK];
  export const PROTOCOL_FEE_TO_ON = _PROTOCOL_FEE_TO_ON[PROTOCOL_NAME][NETWORK];
  export const LP_FEE_TO_ON = _LP_FEE_TO_ON[PROTOCOL_NAME][NETWORK];
  export const PROTOCOL_FEE_TO_OFF = _PROTOCOL_FEE_TO_OFF[PROTOCOL_NAME][NETWORK];
  export const LP_FEE_TO_OFF = _LP_FEE_TO_OFF[PROTOCOL_NAME][NETWORK];
  export const FEE_ON_OFF = _FEE_SWITCH[PROTOCOL_NAME][NETWORK];

  export const REWARD_INTERVAL_TYPE = _REWARD_INTERVAL[PROTOCOL_NAME][NETWORK];

  export const REFERENCE_TOKEN = _REFERENCE_TOKEN[PROTOCOL_NAME][NETWORK];
  export const REWARD_TOKEN = _REWARD_TOKEN[PROTOCOL_NAME][NETWORK];
  export const WHITELIST_TOKENS = _WHITELISTS[PROTOCOL_NAME][NETWORK];
  export const STABLE_COINS = _STABLE_COINS[PROTOCOL_NAME];
  export const STABLE_ORACLE_POOLS = _STABLE_POOLS[PROTOCOL_NAME][NETWORK];
  export const UNTRACKED_PAIRS = _UNTRACKED_PAIRS[PROTOCOL_NAME][NETWORK];
}
