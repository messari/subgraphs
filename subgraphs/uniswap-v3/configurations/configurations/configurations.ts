
import { UniswapV3ArbitrumConfigurations } from "../../protocols/uniswap-v3/config/networks/arbitrum/arbitrum";
import { UniswapV3MainnetConfigurations } from "../../protocols/uniswap-v3/config/networks/mainnet/mainnet";
import { UniswapV3MaticConfigurations } from "../../protocols/uniswap-v3/config/networks/matic/matic";
import { UniswapV3OptimismConfigurations } from "../../protocols/uniswap-v3/config/networks/optimism/optimism";
import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { log } from "@graphprotocol/graph-ts";

export function getNetworkConfigurations(deploy: i32): Configurations {
    switch(deploy) {
        case Deploy.UNISWAP_V3_ARBITRUM: {
            return new UniswapV3ArbitrumConfigurations();
        } case Deploy.UNISWAP_V3_MAINNET: {
            return new UniswapV3MainnetConfigurations();
        } case Deploy.UNISWAP_V3_MATIC: {
            return new UniswapV3MaticConfigurations();
        } case Deploy.UNISWAP_V3_OPTIMISM: {
            return new UniswapV3OptimismConfigurations();
        } default: {
            log.critical("No configurations found for deployment protocol/network", []);
            return new UniswapV3OptimismConfigurations();
        }
    }
}
