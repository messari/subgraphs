import { log } from "@graphprotocol/graph-ts";

import { Configurations } from "./interface";
import { Deploy } from "./deploy";

import { MultichainMainnetConfigurations } from "../../protocols/multichain/config/deployments/multichain-ethereum/configurations";
import { MultichainFantomConfigurations } from "../../protocols/multichain/config/deployments/multichain-fantom/configurations";
// import { MultichainBscConfigurations } from "../../protocols/multichain/config/deployments/multichain-bsc/configurations";
// import { MultichainAvalancheConfigurations } from "../../protocols/multichain/config/deployments/multichain-avalanche/configurations";
// import { MultichainMoonriverConfigurations } from "../../protocols/multichain/config/deployments/multichain-moonriver/configurations";
// import { MultichainPolygonConfigurations } from "../../protocols/multichain/config/deployments/multichain-polygon/configurations";
// import { MultichainOptimismConfigurations } from "../../protocols/multichain/config/deployments/multichain-optimism/configurations";
// import { MultichainMoonbeamConfigurations } from "../../protocols/multichain/config/deployments/multichain-moonbeam/configurations";
// import { MultichainArbitrumConfigurations } from "../../protocols/multichain/config/deployments/multichain-arbitrum/configurations";
// import { MultichainCronosConfigurations } from "../../protocols/multichain/config/deployments/multichain-cronos/configurations";
// import { MultichainGnosisConfigurations } from "../../protocols/multichain/config/deployments/multichain-gnosis/configurations";
// import { MultichainHarmonyConfigurations } from "../../protocols/multichain/config/deployments/multichain-harmony/configurations";
// import { MultichainCeloConfigurations } from "../../protocols/multichain/config/deployments/multichain-celo/configurations";
// import { MultichainBobaConfigurations } from "../../protocols/multichain/config/deployments/multichain-boba/configurations";
// import { MultichainFuseConfigurations } from "../../protocols/multichain/config/deployments/multichain-fuse/configurations";
// import { MultichainAuroraConfigurations } from "../../protocols/multichain/config/deployments/multichain-aurora/configurations";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.MULTICHAIN_MAINNET: {
      return new MultichainMainnetConfigurations();
    }
    case Deploy.MULTICHAIN_FANTOM: {
      return new MultichainFantomConfigurations();
    }
    // case Deploy.MULTICHAIN_BSC: {
    //   return new MultichainBscConfigurations();
    // }
    // case Deploy.MULTICHAIN_AVALANCHE: {
    //   return new MultichainAvalancheConfigurations();
    // }
    // case Deploy.MULTICHAIN_MOONRIVER: {
    //   return new MultichainMoonriverConfigurations();
    // }
    // case Deploy.MULTICHAIN_POLYGON: {
    //   return new MultichainPolygonConfigurations();
    // }
    // case Deploy.MULTICHAIN_OPTIMISM: {
    //   return new MultichainOptimismConfigurations();
    // }
    // case Deploy.MULTICHAIN_MOONBEAM: {
    //   return new MultichainMoonbeamConfigurations();
    // }
    // case Deploy.MULTICHAIN_ARBITRUM: {
    //   return new MultichainArbitrumConfigurations();
    // }
    // case Deploy.MULTICHAIN_CRONOS: {
    //   return new MultichainCronosConfigurations();
    // }
    // case Deploy.MULTICHAIN_GNOSIS: {
    //   return new MultichainGnosisConfigurations();
    // }
    // case Deploy.MULTICHAIN_HARMONY: {
    //   return new MultichainHarmonyConfigurations();
    // }
    // case Deploy.MULTICHAIN_CELO: {
    //   return new MultichainCeloConfigurations();
    // }
    // case Deploy.MULTICHAIN_BOBA: {
    //   return new MultichainBobaConfigurations();
    // }
    // case Deploy.MULTICHAIN_FUSE: {
    //   return new MultichainFuseConfigurations();
    // }
    // case Deploy.MULTICHAIN_AURORA: {
    //   return new MultichainAuroraConfigurations();
    // }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new MultichainMainnetConfigurations();
    }
  }
}
