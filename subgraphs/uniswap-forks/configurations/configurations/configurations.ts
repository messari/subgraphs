import { UniswapV2MainnetConfigurations } from "../../protocols/uniswap-v2/config/networks/mainnet/mainnet";
import { ApeswapBscConfigurations } from "../../protocols/apeswap/config/networks/bsc/bsc";
import { ApeswapMaticConfigurations } from "../../protocols/apeswap/config/networks/matic/matic";
import { SushiswapArbitrumConfigurations } from "../../protocols/sushiswap/config/networks/arbitrum/arbitrum";
import { SushiswapAvalancheConfigurations } from "../../protocols/sushiswap/config/networks/avalanche/avalanche";
import { SushiswapBscConfigurations } from "../../protocols/sushiswap/config/networks/bsc/bsc";
import { SushiswapCeloConfigurations } from "../../protocols/sushiswap/config/networks/celo/celo";
import { SushiswapFantomConfigurations } from "../../protocols/sushiswap/config/networks/fantom/fantom";
import { SushiswapFuseConfigurations } from "../../protocols/sushiswap/config/networks/fuse/fuse";
import { SushiswapMainnetConfigurations } from "../../protocols/sushiswap/config/networks/mainnet/mainnet";
import { SushiswapMaticConfigurations } from "../../protocols/sushiswap/config/networks/matic/matic";
import { SushiswapMoonbeamConfigurations } from "../../protocols/sushiswap/config/networks/moonbeam/moonbeam";
import { SushiswapMoonriverConfigurations } from "../../protocols/sushiswap/config/networks/moonriver/moonriver";
import { SushiswapXdaiConfigurations } from "../../protocols/sushiswap/config/networks/xdai/xdai";
import { UbeswapCeloConfigurations } from "../../protocols/ubeswap/config/networks/celo/celo";
import { SpiritSwapFantomConfigurations } from "../../protocols/spiritswap/config/networks/fantom/fantom";
import { QuickswapMaticConfigurations } from "../../protocols/quickswap/config/networks/matic/matic";
import { SolarbeamMoonriverConfigurations } from "../../protocols/solarbeam/config/networks/moonriver/moonriver";
import { TraderJoeAvalancheConfigurations } from "../../protocols/trader-joe/config/networks/avalanche/avalanche";
import { TrisolarisAuroraConfigurations } from "../../protocols/trisolaris/config/networks/aurora/aurora";
import { VSSFinanceCronosConfigurations } from "../../protocols/vvs-finance/config/networks/cronos/cronos";
import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { log } from "@graphprotocol/graph-ts";

export function getNetworkConfigurations(deploy: i32): Configurations {
    switch(deploy) {
        case Deploy.APESWAP_BSC: {
            return new ApeswapBscConfigurations();
        } case Deploy.APESWAP_MATIC: {
            return new ApeswapMaticConfigurations();
        } case Deploy.SUSHISWAP_ARBITRUM: {
            return new SushiswapArbitrumConfigurations();
        } case Deploy.SUSHISWAP_AVALANCHE: {
            return new SushiswapAvalancheConfigurations();
        } case Deploy.SUSHISWAP_BSC: {
            return new SushiswapBscConfigurations();
        } case Deploy.SUSHISWAP_CELO: {
            return new SushiswapCeloConfigurations();
        } case Deploy.SUSHISWAP_FANTOM: {
            return new SushiswapFantomConfigurations();
        } case Deploy.SUSHISWAP_FUSE: {
            return new SushiswapFuseConfigurations();
        } case Deploy.SUSHISWAP_MAINNET: {
            return new SushiswapMainnetConfigurations();
        } case Deploy.SUSHISWAP_MATIC: {
            return new SushiswapMaticConfigurations();
        } case Deploy.SUSHISWAP_MOONBEAM: {
            return new SushiswapMoonbeamConfigurations();
        } case Deploy.SUSHISWAP_MOONRIVER: {
            return new SushiswapMoonriverConfigurations();
        } case Deploy.SUSHISWAP_XDAI: {
            return new SushiswapXdaiConfigurations();
        } case Deploy.UNISWAP_V2_MAINNET: {
            return new UniswapV2MainnetConfigurations();
        } case Deploy.SPIRITSWAP_FANTOM: {
            return new SpiritSwapFantomConfigurations();
        } case Deploy.QUICKSWAP_MATIC: {
            return new QuickswapMaticConfigurations();
        } case Deploy.SOLARBEAM_MOONRIVER: {
            return new SolarbeamMoonriverConfigurations();
        } case Deploy.TRADER_JOE_AVALANCHE: {
            return new TraderJoeAvalancheConfigurations();
        } case Deploy.TRISOLARIS_AURORA: {
            return new TrisolarisAuroraConfigurations();
        } case Deploy.VVS_FINANCE_CRONOS: {
            return new VSSFinanceCronosConfigurations();
        }case Deploy.UBESWAP_CELO: {
            return new UbeswapCeloConfigurations();
        }  default: {
            log.critical("No configurations found for deployment protocol/network", []);
            return new SushiswapArbitrumConfigurations();
        }
    }
}
