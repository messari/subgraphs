import { UniswapV2MainnetConfigurations } from "../../protocols/uniswap-v2/config/deployments/uniswap-v2-ethereum/configurations";
import { ApeswapBscConfigurations } from "../../protocols/apeswap/config/deployments/apeswap-bsc/configurations";
import { ApeswapMaticConfigurations } from "../../protocols/apeswap/config/deployments/apeswap-polygon/configurations";
import { SushiswapArbitrumConfigurations } from "../../protocols/sushiswap/config/deployments/sushiswap-arbitrum/configurations";
import { SushiswapAvalancheConfigurations } from "../../protocols/sushiswap/config/deployments/sushiswap-avalanche/configurations";
import { SushiswapBscConfigurations } from "../../protocols/sushiswap/config/deployments/sushiswap-bsc/configurations";
import { SushiswapCeloConfigurations } from "../../protocols/sushiswap/config/deployments/sushiswap-celo/configurations";
import { SushiswapFantomConfigurations } from "../../protocols/sushiswap/config/deployments/sushiswap-fantom/configurations";
import { SushiswapFuseConfigurations } from "../../protocols/sushiswap/config/deployments/sushiswap-fuse/configurations";
import { SushiswapMainnetConfigurations } from "../../protocols/sushiswap/config/deployments/sushiswap-ethereum/configurations";
import { SushiswapMaticConfigurations } from "../../protocols/sushiswap/config/deployments/sushiswap-polygon/configurations";
import { SushiswapMoonbeamConfigurations } from "../../protocols/sushiswap/config/deployments/sushiswap-moonbeam/configurations";
import { SushiswapMoonriverConfigurations } from "../../protocols/sushiswap/config/deployments/sushiswap-moonriver/configurations";
import { SushiswapGnosisConfigurations } from "../../protocols/sushiswap/config/deployments/sushiswap-gnosis/configurations";
import { SushiswapHarmonyConfigurations } from "../../protocols/sushiswap/config/deployments/sushiswap-harmony/configurations";
import { SpookyswapFantomConfigurations } from "../../protocols/spookyswap/config/deployments/spookyswap-fantom/configurations";
import { UbeswapCeloConfigurations } from "../../protocols/ubeswap/config/deployments/ubeswap-celo/configurations";
import { SpiritSwapFantomConfigurations } from "../../protocols/spiritswap/config/deployments/spiritswap-fantom/configurations";
import { QuickswapMaticConfigurations } from "../../protocols/quickswap/config/deployments/quickswap-polygon/configurations";
import { SolarbeamMoonriverConfigurations } from "../../protocols/solarbeam/config/deployments/solarbeam-moonriver/configurations";
import { TraderJoeAvalancheConfigurations } from "../../protocols/trader-joe/config/deployments/trader-joe-avalanche/configurations";
import { TrisolarisAuroraConfigurations } from "../../protocols/trisolaris/config/deployments/trisolaris-aurora/configurations";
import { VSSFinanceCronosConfigurations } from "../../protocols/vvs-finance/config/deployments/vvs-finance-cronos/configurations";
import { MMFinanceCronosConfigurations } from "../../protocols/mm-finance/config/deployments/mm-finance-cronos/configurations";
import { MMFinanceMaticConfigurations } from "../../protocols/mm-finance/config/deployments/mm-finance-polygon/configurations";
import { HoneyswapGnosisConfigurations } from "../../protocols/honeyswap/config/deployments/honeyswap-gnosis/configurations";
import { HoneyswapMaticConfigurations } from "../../protocols/honeyswap/config/deployments/honeyswap-polygon/configurations";
import { PangolinAvalancheConfigurations } from "../../protocols/pangolin/config/deployments/pangolin-avalanche/configurations";
import { BiswapBscConfigurations } from "../../protocols/biswap/config/deployments/biswap-bsc/configurations";

import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { log } from "@graphprotocol/graph-ts";

// This function is called to load in the proper configurations for a protocol/network deployment.
// To add a new deployment, add a value to the `Deploy` namespace and add a new configuration class to the network specific typescript file in the `protocols` folder.
// Finally, add a new entry for this deployment to the getNetworkConfigurations() function
export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.APESWAP_BSC: {
      return new ApeswapBscConfigurations();
    }
    case Deploy.APESWAP_POLYGON: {
      return new ApeswapMaticConfigurations();
    }
    case Deploy.SUSHISWAP_ARBITRUM: {
      return new SushiswapArbitrumConfigurations();
    }
    case Deploy.SUSHISWAP_AVALANCHE: {
      return new SushiswapAvalancheConfigurations();
    }
    case Deploy.SUSHISWAP_BSC: {
      return new SushiswapBscConfigurations();
    }
    case Deploy.SUSHISWAP_CELO: {
      return new SushiswapCeloConfigurations();
    }
    case Deploy.SUSHISWAP_FANTOM: {
      return new SushiswapFantomConfigurations();
    }
    case Deploy.SUSHISWAP_FUSE: {
      return new SushiswapFuseConfigurations();
    }
    case Deploy.SUSHISWAP_ETHEREUM: {
      return new SushiswapMainnetConfigurations();
    }
    case Deploy.SUSHISWAP_POLYGON: {
      return new SushiswapMaticConfigurations();
    }
    case Deploy.SUSHISWAP_MOONBEAM: {
      return new SushiswapMoonbeamConfigurations();
    }
    case Deploy.SUSHISWAP_MOONRIVER: {
      return new SushiswapMoonriverConfigurations();
    }
    case Deploy.SUSHISWAP_GNOSIS: {
      return new SushiswapGnosisConfigurations();
    }
    case Deploy.SUSHISWAP_HARMONY: {
      return new SushiswapHarmonyConfigurations();
    }
    case Deploy.UNISWAP_V2_ETHEREUM: {
      return new UniswapV2MainnetConfigurations();
    }
    case Deploy.SPOOKYSWAP_FANTOM: {
      return new SpookyswapFantomConfigurations();
    }
    case Deploy.SPIRITSWAP_FANTOM: {
      return new SpiritSwapFantomConfigurations();
    }
    case Deploy.QUICKSWAP_POLYGON: {
      return new QuickswapMaticConfigurations();
    }
    case Deploy.SOLARBEAM_MOONRIVER: {
      return new SolarbeamMoonriverConfigurations();
    }
    case Deploy.TRADER_JOE_AVALANCHE: {
      return new TraderJoeAvalancheConfigurations();
    }
    case Deploy.TRISOLARIS_AURORA: {
      return new TrisolarisAuroraConfigurations();
    }
    case Deploy.VVS_FINANCE_CRONOS: {
      return new VSSFinanceCronosConfigurations();
    }
    case Deploy.UBESWAP_CELO: {
      return new UbeswapCeloConfigurations();
    }
    case Deploy.HONEYSWAP_GNOSIS: {
      return new HoneyswapGnosisConfigurations();
    }
    case Deploy.HONEYSWAP_POLYGON: {
      return new HoneyswapMaticConfigurations();
    }
    case Deploy.MM_FINANCE_CRONOS: {
      return new MMFinanceCronosConfigurations();
    }
    case Deploy.MM_FINANCE_POLYGON: {
      return new MMFinanceMaticConfigurations();
    }
    case Deploy.PANGOLIN_AVALANCHE: {
      return new PangolinAvalancheConfigurations();
    }
    case Deploy.BISWAP_BSC: {
      return new BiswapBscConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new SushiswapArbitrumConfigurations();
    }
  }
}
