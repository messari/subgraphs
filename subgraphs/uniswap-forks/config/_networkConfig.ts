import { Address, BigDecimal, dataSource, log } from "@graphprotocol/graph-ts";
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
import { Network, Protocol } from "../src/common/constants";
import { toBytesArray } from "../src/common/utils/utils";
import { Factory } from "../generated/Factory/Factory";

let PROTOCOL = Protocol.APESWAP;
let NETWORK = dataSource.network().toLowerCase();

class NetworkConfigurations {
  PROTOCOL_NAME: string;
  PROTOCOL_SLUG: string;
  NETWORK: string;

  FACTORY_ADDRESS: string
  FACTORY_CONTRACT: Factory

  TRADING_FEE: BigDecimal;
  PROTOCOL_FEE_TO_ON: BigDecimal;
  LP_FEE_TO_ON: BigDecimal;
  PROTOCOL_FEE_TO_OFF: BigDecimal;
  LP_FEE_TO_OFF: BigDecimal;
  FEE_ON_OFF: string;

  REWARD_INTERVAL_TYPE: string;

  NATIVE_TOKEN: string;
  REWARD_TOKENS: string;
  WHITELIST_TOKENS: string[];
  STABLE_COINS: string[];
  STABLE_ORACLE_POOLS: string[];
  UNTRACKED_PAIRS: string[];

  constructor() {
  }

  // constructor(Protocol: string, Network: string) {
  //   this.NETWORK = Network.toUpperCase();

  //   this.PROTOCOL_NAME = Protocol;
  //   this.PROTOCOL_SLUG = _PROTOCOL_SLUG[Protocol];

  //   this.FACTORY_ADDRESS = _FACTORY_ADDRESS[Protocol][Network];
  //   this.FACTORY_CONTRACT = Factory.bind(Address.fromString(this.FACTORY_ADDRESS));

  //   this.TRADING_FEE = _TRADING_FEE[Protocol][Network];
  //   this.PROTOCOL_FEE_TO_ON = _PROTOCOL_FEE_TO_ON[Protocol][Network];
  //   this.LP_FEE_TO_ON = _LP_FEE_TO_ON[Protocol][Network];
  //   this.PROTOCOL_FEE_TO_OFF = _PROTOCOL_FEE_TO_OFF[Protocol][Network];
  //   this.LP_FEE_TO_OFF = _LP_FEE_TO_OFF[Protocol][Network];
  //   this.FEE_ON_OFF = _FEE_SWITCH[Protocol][Network];

  //   this.REWARD_INTERVAL_TYPE = _REWARD_INTERVAL[Protocol][Network];
  //   this.NATIVE_TOKEN = _REFERENCE_TOKEN[Protocol][Network];
  //   this.REWARD_TOKENS = _REWARD_TOKEN[Protocol][Network];
  //   this.WHITELIST_TOKENS = _WHITELISTS[Protocol][Network];
  //   this.STABLE_COINS = _STABLE_COINS[Protocol];
  //   this.STABLE_ORACLE_POOLS = _STABLE_POOLS[Protocol][Network];
  //   this.UNTRACKED_PAIRS = _UNTRACKED_PAIRS[Protocol][Network];
  // }


  }
}

let NewtworkConfigurations = new NetworkConfigurations()

if (PROTOCOL == Protocol.APESWAP && dataSource.network().toUpperCase() == Network.BSC) {
  
} else if (PROTOCOL == Protocol.APESWAP && dataSource.network().toUpperCase() == Network.MATIC) {
  
} else if (PROTOCOL == Protocol.SUSHISWAP && dataSource.network().toUpperCase() == Network.ARBITRUM_ONE) {
  
} else if (PROTOCOL == Protocol.SUSHISWAP && dataSource.network().toUpperCase() == Network.AVALANCHE) {
  
} else if (PROTOCOL == Protocol.SUSHISWAP && dataSource.network().toUpperCase() == Network.BSC) {
  
} else if (PROTOCOL == Protocol.SUSHISWAP && dataSource.network().toUpperCase() == Network.CELO) {
  
} else if (PROTOCOL == Protocol.SUSHISWAP && dataSource.network().toUpperCase() == Network.FANTOM) {
  
} else if (PROTOCOL == Protocol.SUSHISWAP && dataSource.network().toUpperCase() == Network.FUSE) {
  
} else if (PROTOCOL == Protocol.SUSHISWAP && dataSource.network().toUpperCase() == Network.MAINNET) {
  
} else if (PROTOCOL == Protocol.SUSHISWAP && dataSource.network().toUpperCase() == Network.MATIC) {
  
} else if (PROTOCOL == Protocol.SUSHISWAP && dataSource.network().toUpperCase() == Network.MOONBEAM) {
  
} else if (PROTOCOL == Protocol.SUSHISWAP && dataSource.network().toUpperCase() == Network.MOONRIVER) {
  
} else if (PROTOCOL == Protocol.SUSHISWAP && dataSource.network().toUpperCase() == Network.XDAI) {
  
} else if (PROTOCOL == Protocol.UNISWAP_V2 && dataSource.network().toUpperCase() == Network.MAINNET) {
  
}



let Configurations = new NetworkConfigurations(Protocol.SUSHISWAP, dataSource.network());
