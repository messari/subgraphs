import { UniswapV2MainnetConfigurations } from "../../protocols/uniswap-v2/config/networks/ethereum/ethereum";
import { ApeswapBscConfigurations } from "../../protocols/apeswap/config/networks/bsc/bsc";
import { ApeswapMaticConfigurations } from "../../protocols/apeswap/config/networks/polygon/polygon";
import { SushiswapArbitrumConfigurations } from "../../protocols/sushiswap/config/networks/arbitrum/arbitrum";
import { SushiswapAvalancheConfigurations } from "../../protocols/sushiswap/config/networks/avalanche/avalanche";
import { SushiswapBscConfigurations } from "../../protocols/sushiswap/config/networks/bsc/bsc";
import { SushiswapCeloConfigurations } from "../../protocols/sushiswap/config/networks/celo/celo";
import { SushiswapFantomConfigurations } from "../../protocols/sushiswap/config/networks/fantom/fantom";
import { SushiswapFuseConfigurations } from "../../protocols/sushiswap/config/networks/fuse/fuse";
import { SushiswapMainnetConfigurations } from "../../protocols/sushiswap/config/networks/ethereum/ethereum";
import { SushiswapMaticConfigurations } from "../../protocols/sushiswap/config/networks/polygon/polygon";
import { SushiswapMoonbeamConfigurations } from "../../protocols/sushiswap/config/networks/moonbeam/moonbeam";
import { SushiswapMoonriverConfigurations } from "../../protocols/sushiswap/config/networks/moonriver/moonriver";
import { SushiswapXdaiConfigurations } from "../../protocols/sushiswap/config/networks/gnosis/gnosis";
import { SpookyswapFantomConfigurations } from "../../protocols/spookyswap/config/networks/fantom/fantom";
import { UbeswapCeloConfigurations } from "../../protocols/ubeswap/config/networks/celo/celo";
import { SpiritSwapFantomConfigurations } from "../../protocols/spiritswap/config/networks/fantom/fantom";
import { QuickswapMaticConfigurations } from "../../protocols/quickswap/config/networks/polygon/polygon";
import { SolarbeamMoonriverConfigurations } from "../../protocols/solarbeam/config/networks/moonriver/moonriver";
import { TraderJoeAvalancheConfigurations } from "../../protocols/trader-joe/config/networks/avalanche/avalanche";
import { TrisolarisAuroraConfigurations } from "../../protocols/trisolaris/config/networks/aurora/aurora";
import { VSSFinanceCronosConfigurations } from "../../protocols/vvs-finance/config/networks/cronos/cronos";
import { MMFinanceCronosConfigurations } from "../../protocols/mm-finance/config/networks/cronos/cronos";
import { MMFinanceMaticConfigurations } from "../../protocols/mm-finance/config/networks/polygon/polygon";
import { HoneyswapXdaiConfigurations } from "../../protocols/honeyswap/config/networks/gnosis/gnosis";
import { HoneyswapMaticConfigurations } from "../../protocols/honeyswap/config/networks/polygon/polygon";
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
      return new SushiswapXdaiConfigurations();
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
      return new HoneyswapXdaiConfigurations();
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
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new SushiswapArbitrumConfigurations();
    }
  }
}
