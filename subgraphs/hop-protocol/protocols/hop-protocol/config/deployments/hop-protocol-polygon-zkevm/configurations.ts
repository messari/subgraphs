import { log } from "@graphprotocol/graph-ts";
import { Configurations } from "../../../../../configurations/configurations/interface";
import {
  ArbitrumToken,
  MainnetToken,
  OptimismToken,
  XdaiToken,
  PolygonToken,
  ArbitrumNovaToken,
  BaseToken,
  LineaToken,
  ZERO_ADDRESS,
  RewardTokens,
  ArbitrumNovaHtoken,
  ArbitrumNovaAmm,
  PolygonZKEVMToken,
  PolygonZKEVMHToken,
  PolygonZKEVMAmm,
  PolygonZKEVMRewardToken,
  PolygonZKEVMBridge,
} from "../../../../../src/sdk/util/constants";
import { Network } from "../../../../../src/sdk/util/constants";

export class HopProtocolPolygonZKEVMConfigurations implements Configurations {
  getNetwork(): string {
    return Network.POLYGON_ZKEVM;
  }
  getArbitrumPoolAddressFromBridgeAddress(bridgeAddress: string): string {
    return bridgeAddress;
  }
  getPolygonPoolAddressFromBridgeAddress(bridgeAddress: string): string {
    return bridgeAddress;
  }
  getXdaiPoolAddressFromBridgeAddress(bridgeAddress: string): string {
    return bridgeAddress;
  }
  getOptimismPoolAddressFromBridgeAddress(bridgeAddress: string): string {
    return bridgeAddress;
  }
  getPolygonZKEVMPoolAddressFromBridgeAddress(bridgeAddress: string): string {
    return bridgeAddress;
  }
  getArbitrumNovaPoolAddressFromBridgeAddress(bridgeAddress: string): string {
    return bridgeAddress;
  }

  getPoolAddressFromChainId(chainId: string, bridgeAddress: string): string {
    return bridgeAddress || chainId;
  }
  getPoolAddressFromTokenAddress(tokenAddress: string): string {
    if (tokenAddress == PolygonZKEVMToken.ETH) {
      return PolygonZKEVMAmm.ETH; //ETH AMM
    } else {
      log.critical("Token not found", []);
      return "";
    }
  }
  getTokenDetails(tokenAddress: string): string[] {
    if (this.getEthTokens().includes(tokenAddress)) {
      return ["ETH", "ETH", "18", PolygonZKEVMBridge.ETH];
    } else if (tokenAddress == RewardTokens.HOP) {
      return ["HOP", "HOP Token", "18", ZERO_ADDRESS];
    } else {
      log.critical("Token not found", []);
      return [];
    }
  }

  getArbitrumNovaConfigFromTokenAddress(tokenAddress: string): string[] {
    if (tokenAddress == PolygonZKEVMToken.ETH)
      return [
        ArbitrumNovaToken.ETH,
        ArbitrumNovaHtoken.ETH,
        "HOP-ETH",
        "hETH/ETH Nova Pool - ETH",
        "hETH/ETH Nova Pool - hETH",
        ArbitrumNovaAmm.ETH,
        this.getTokenDetails(tokenAddress)[0],
        this.getTokenDetails(tokenAddress)[1],
        this.getTokenDetails(tokenAddress)[2],
      ];
    else {
      log.critical("Config not found", []);
    }
    return [""];
  }

  getPoolAddressFromRewardTokenAddress(rewardToken: string): string {
    if (rewardToken == PolygonZKEVMRewardToken.ETH) return PolygonZKEVMAmm.ETH;
    else {
      log.critical("Pool not found for reward token: {}", [rewardToken]);
      return "";
    }
  }

  getTokenAddressFromBridgeAddress(bridgeAddress: string): string[] {
    if (bridgeAddress == PolygonZKEVMBridge.ETH) {
      return [PolygonZKEVMToken.ETH, PolygonZKEVMHToken.ETH];
    } else {
      log.critical("Token not found", []);
      return [""];
    }
  }

  getCrossTokenAddress(chainId: string, tokenAddress: string): string {
    if (chainId == "42161") {
      return this.getArbitrumCrossTokenFromTokenAddress(tokenAddress); //Arbitrum
    } else if (chainId == "10") {
      return this.getOptimismCrossTokenFromTokenAddress(tokenAddress); //Optimism
    } else if (chainId == "100") {
      return this.getXdaiCrossTokenFromTokenAddress(tokenAddress); //Xdai
    } else if (chainId == "137") {
      return this.getPolygonCrossTokenFromTokenAddress(tokenAddress); //Polygon
    } else if (chainId == "42170") {
      return this.getArbitrumNovaConfigFromTokenAddress(tokenAddress)[0];
    } else if (chainId == "1") {
      return this.getMainnetCrossTokenFromTokenAddress(tokenAddress); //Mainnet
    } else if (chainId == "8453") {
      return this.getBaseCrossTokenFromTokenAddress(tokenAddress);
    } else if (chainId == "59144") {
      return this.getLineaCrossTokenFromTokenAddress(tokenAddress);
    } else if (chainId == "1101") {
      return this.getPolygonZKEVMCrossTokenFromTokenAddress(tokenAddress);
    } else {
      log.critical("Chain not found", []);
      return "";
    }
  }

  getXdaiCrossTokenFromTokenAddress(tokenAddress: string): string {
    if (tokenAddress == PolygonZKEVMToken.ETH) {
      return XdaiToken.ETH;
    } else {
      log.critical("Token not found", []);
    }
    return "";
  }
  getArbitrumCrossTokenFromTokenAddress(tokenAddress: string): string {
    if (tokenAddress == PolygonZKEVMToken.ETH) {
      return ArbitrumToken.ETH;
    } else {
      log.critical("Token not found", []);
    }
    return "";
  }

  getOptimismCrossTokenFromTokenAddress(tokenAddress: string): string {
    if (tokenAddress == PolygonZKEVMToken.ETH) {
      return OptimismToken.ETH;
    } else {
      log.critical("Token not found", []);
    }
    return "";
  }

  getMainnetCrossTokenFromTokenAddress(tokenAddress: string): string {
    if (tokenAddress == PolygonZKEVMToken.ETH) {
      return MainnetToken.ETH; //MAINNET ETH
    } else {
      log.critical("Token not found", []);
    }
    return "";
  }

  getBaseCrossTokenFromTokenAddress(tokenAddress: string): string {
    if (tokenAddress == PolygonZKEVMToken.ETH) return BaseToken.ETH;
    else {
      log.critical("Base CrossToken not found for token: {}", [tokenAddress]);
    }
    return "";
  }

  getLineaCrossTokenFromTokenAddress(tokenAddress: string): string {
    if (tokenAddress == PolygonZKEVMToken.ETH) return LineaToken.ETH;
    else {
      log.critical("Linea CrossToken not found for token: {}", [tokenAddress]);
    }
    return "";
  }

  getPolygonCrossTokenFromTokenAddress(tokenAddress: string): string {
    if (tokenAddress == PolygonZKEVMToken.ETH) return PolygonToken.ETH;
    else {
      log.critical("Polygon CrossToken not found for token: {}", [
        tokenAddress,
      ]);
    }
    return "";
  }
  getPolygonZKEVMCrossTokenFromTokenAddress(tokenAddress: string): string {
    return tokenAddress;
  }

  getTokenAddressFromPoolAddress(poolAddress: string): string[] {
    if (poolAddress == PolygonZKEVMAmm.ETH) {
      return [PolygonZKEVMToken.ETH, PolygonZKEVMHToken.ETH];
    } else {
      log.critical("Token not found", []);
      return [""];
    }
  }

  getPoolAddressFromBridgeAddress(bridgeAddress: string): string {
    if (bridgeAddress == PolygonZKEVMBridge.ETH) {
      return PolygonZKEVMAmm.ETH;
    } else {
      log.critical("Address not found", []);
      return "";
    }
  }

  getPoolDetails(poolAddress: string): string[] {
    if (poolAddress == PolygonZKEVMAmm.ETH) {
      return ["HOP-ETH", "hETH/ETH Pool - ETH", "hETH/ETH Pool - hETH"];
    } else {
      log.critical("Token not found", []);
      return [];
    }
  }

  getTokenList(): string[] {
    return [PolygonZKEVMToken.ETH];
  }
  getPoolsList(): string[] {
    return [PolygonZKEVMAmm.ETH];
  }
  getBridgeList(): string[] {
    return [PolygonZKEVMBridge.ETH];
  }

  getRewardTokenList(): string[] {
    return [PolygonZKEVMRewardToken.ETH];
  }
  getUsdcPools(): string[] {
    return [];
  }
  getDaiPools(): string[] {
    return [];
  }
  getUsdcTokens(): string[] {
    return [];
  }
  getDaiTokens(): string[] {
    return [];
  }
  getEthTokens(): string[] {
    return [PolygonZKEVMToken.ETH, PolygonZKEVMToken.ETH];
  }
  getMaticTokens(): string[] {
    return [];
  }
  getUsdtTokens(): string[] {
    return [];
  }
  getUsdtPools(): string[] {
    return [];
  }
  getEthPools(): string[] {
    return [];
  }
  getSnxPools(): string[] {
    return [];
  }
  getSnxTokens(): string[] {
    return [];
  }
  getMaticPools(): string[] {
    return [];
  }
  getRethPools(): string[] {
    return [];
  }
  getRethTokens(): string[] {
    return [];
  }

  getsUSDPools(): string[] {
    return [];
  }
  getsUSDTokens(): string[] {
    return [];
  }

  getMagicPools(): string[] {
    return [];
  }
  getMagicTokens(): string[] {
    return [];
  }
}
