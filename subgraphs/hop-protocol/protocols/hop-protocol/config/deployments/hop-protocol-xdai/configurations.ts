import { log } from "@graphprotocol/graph-ts";
import { Configurations } from "../../../../../configurations/configurations/interface";
import {
  ArbitrumToken,
  MainnetToken,
  OptimismToken,
  XdaiAmm,
  XdaiBridge,
  XdaiToken,
  XdaiHtoken,
  PolygonToken,
  XdaiRewardToken,
  ZERO_ADDRESS,
  RewardTokens,
  ArbitrumNovaToken,
  ArbitrumNovaHtoken,
  ArbitrumNovaAmm,
  BaseToken,
  LineaToken,
} from "../../../../../src/sdk/util/constants";
import { Network } from "../../../../../src/sdk/util/constants";

export class HopProtocolxDaiConfigurations implements Configurations {
  getNetwork(): string {
    return Network.XDAI;
  }

  getPoolAddressFromTokenAddress(tokenAddress: string): string {
    if (tokenAddress == XdaiToken.USDC) return XdaiAmm.USDC;
    else if (tokenAddress == XdaiToken.DAI) return XdaiAmm.DAI;
    else if (tokenAddress == XdaiToken.USDT) return XdaiAmm.USDT;
    else if (tokenAddress == XdaiToken.ETH) return XdaiAmm.ETH;
    else if (tokenAddress == XdaiToken.MATIC) return XdaiAmm.MATIC;
    else {
      log.critical("Token not found", []);
      return "";
    }
  }
  getTokenDetails(tokenAddress: string): string[] {
    if (this.getUsdcTokens().includes(tokenAddress)) {
      return ["USDC", "USD Coin", "6", XdaiBridge.USDC];
    } else if (this.getDaiTokens().includes(tokenAddress)) {
      return ["DAI", "DAI Stablecoin", "18", XdaiBridge.DAI];
    } else if (this.getUsdtTokens().includes(tokenAddress)) {
      return ["USDT", "Tether USD", "6", XdaiBridge.USDT];
    } else if (this.getEthTokens().includes(tokenAddress)) {
      return ["ETH", "ETH", "18", XdaiBridge.ETH];
    } else if (this.getMaticTokens().includes(tokenAddress)) {
      return ["MATIC", "MATIC", "18", XdaiBridge.MATIC];
    } else if (tokenAddress == RewardTokens.GNO) {
      return ["GNO", "Gnosis Token", "18", ZERO_ADDRESS];
    } else if (tokenAddress == RewardTokens.HOP) {
      return ["HOP", "HOP Token", "18", ZERO_ADDRESS];
    } else {
      log.critical("Token not found", []);
      return [];
    }
  }

  getCrossTokenAddress(chainId: string, tokenAddress: string): string {
    if (chainId == "42161")
      return this.getArbitrumCrossTokenFromTokenAddress(tokenAddress);
    else if (chainId == "10")
      return this.getOptimismCrossTokenFromTokenAddress(tokenAddress);
    else if (chainId == "100")
      return this.getXdaiCrossTokenFromTokenAddress(tokenAddress);
    else if (chainId == "137")
      return this.getPolygonCrossTokenFromTokenAddress(tokenAddress);
    else if (chainId == "1")
      return this.getMainnetCrossTokenFromTokenAddress(tokenAddress);
    else if (chainId == "42170")
      return this.getArbitrumNovaConfigFromTokenAddress(tokenAddress)[0];
    else if (chainId == "8453")
      return this.getBaseCrossTokenFromTokenAddress(tokenAddress);
    else if (chainId == "59144")
      return this.getLineaCrossTokenFromTokenAddress(tokenAddress);
    else {
      log.critical("Chain not found", []);
      return "";
    }
  }

  getArbitrumNovaConfigFromTokenAddress(tokenAddress: string): string[] {
    if (tokenAddress == XdaiToken.ETH)
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

  getArbitrumNovaPoolAddressFromBridgeAddress(bridgeAddress: string): string {
    return bridgeAddress;
  }
  getArbitrumCrossTokenFromTokenAddress(tokenAddress: string): string {
    if (tokenAddress == XdaiToken.USDC) {
      return ArbitrumToken.USDC;
    } else if (tokenAddress == XdaiToken.DAI) {
      return ArbitrumToken.DAI;
    } else if (tokenAddress == XdaiToken.USDT) {
      return ArbitrumToken.USDT;
    } else if (tokenAddress == XdaiToken.ETH) {
      return ArbitrumToken.ETH;
    } else {
      log.critical("Token not found", []);
    }
    return "";
  }

  getPolygonCrossTokenFromTokenAddress(tokenAddress: string): string {
    if (tokenAddress == XdaiToken.USDC) {
      return PolygonToken.USDC;
    } else if (tokenAddress == XdaiToken.DAI) {
      return PolygonToken.DAI;
    } else if (tokenAddress == XdaiToken.USDT) {
      return PolygonToken.USDT;
    } else if (tokenAddress == XdaiToken.MATIC) {
      return PolygonToken.MATIC;
    } else if (tokenAddress == XdaiToken.ETH) {
      return PolygonToken.ETH;
    } else {
      log.critical("Token not found", []);
    }
    return "";
  }

  getOptimismCrossTokenFromTokenAddress(tokenAddress: string): string {
    if (tokenAddress == XdaiToken.USDC) {
      return OptimismToken.USDC;
    } else if (tokenAddress == XdaiToken.DAI) {
      return OptimismToken.DAI;
    } else if (tokenAddress == XdaiToken.USDT) {
      return OptimismToken.USDT;
    } else if (tokenAddress == XdaiToken.ETH) {
      return OptimismToken.ETH;
    } else {
      log.critical("Token not found", []);
    }
    return "";
  }

  getMainnetCrossTokenFromTokenAddress(tokenAddress: string): string {
    if (tokenAddress == XdaiToken.USDC) return MainnetToken.USDC;
    else if (tokenAddress == XdaiToken.DAI) return MainnetToken.DAI;
    else if (tokenAddress == XdaiToken.USDT) return MainnetToken.USDT;
    else if (tokenAddress == XdaiToken.MATIC) return MainnetToken.MATIC;
    else if (tokenAddress == XdaiToken.ETH) return MainnetToken.ETH;
    else {
      log.critical("Token not found", []);
    }
    return "";
  }

  getBaseCrossTokenFromTokenAddress(tokenAddress: string): string {
    if (tokenAddress == XdaiToken.USDC) return BaseToken.USDC;
    if (tokenAddress == XdaiToken.ETH) return BaseToken.ETH;
    else {
      log.critical("Base CrossToken not found for token: {}", [tokenAddress]);
    }
    return "";
  }

  getLineaCrossTokenFromTokenAddress(tokenAddress: string): string {
    if (tokenAddress == XdaiToken.ETH) return LineaToken.ETH;
    else {
      log.critical("Linea CrossToken not found for token: {}", [tokenAddress]);
    }
    return "";
  }

  getTokenAddressFromBridgeAddress(bridgeAddress: string): string[] {
    if (bridgeAddress == XdaiBridge.USDC) {
      return [XdaiToken.USDC, XdaiHtoken.USDC];
    } else if (bridgeAddress == XdaiBridge.DAI) {
      return [XdaiToken.DAI, XdaiHtoken.DAI];
    } else if (bridgeAddress == XdaiBridge.USDT) {
      return [XdaiToken.USDT, XdaiHtoken.USDT];
    } else if (bridgeAddress == XdaiBridge.ETH) {
      return [XdaiToken.ETH, XdaiHtoken.ETH];
    } else if (bridgeAddress == XdaiBridge.MATIC) {
      return [XdaiToken.MATIC, XdaiHtoken.MATIC];
    } else {
      log.critical("Token not found", []);
      return [""];
    }
  }

  getTokenAddressFromPoolAddress(poolAddress: string): string[] {
    if (poolAddress == XdaiAmm.USDC) return [XdaiToken.USDC, XdaiHtoken.USDC];
    else if (poolAddress == XdaiAmm.DAI) return [XdaiToken.DAI, XdaiHtoken.DAI];
    else if (poolAddress == XdaiAmm.USDT)
      return [XdaiToken.USDT, XdaiHtoken.USDT];
    else if (poolAddress == XdaiAmm.ETH) return [XdaiToken.ETH, XdaiHtoken.ETH];
    else if (poolAddress == XdaiAmm.MATIC)
      return [XdaiToken.MATIC, XdaiHtoken.MATIC];
    else {
      log.critical("Token not found", []);
      return [""];
    }
  }

  getPoolAddressFromBridgeAddress(bridgeAddress: string): string {
    if (bridgeAddress == XdaiBridge.USDC) return XdaiAmm.USDC;
    else if (bridgeAddress == XdaiBridge.DAI) return XdaiAmm.DAI;
    else if (bridgeAddress == XdaiBridge.USDT) return XdaiAmm.USDT;
    else if (bridgeAddress == XdaiBridge.ETH) return XdaiAmm.ETH;
    else if (bridgeAddress == XdaiBridge.MATIC) return XdaiAmm.MATIC;
    else {
      log.critical("Bridge Address not found", []);
      return "";
    }
  }

  getPoolDetails(poolAddress: string): string[] {
    if (poolAddress == XdaiAmm.USDC)
      return ["HOP-USDC", "hUSDC/USDC Pool - USDC", "hUSDC/USDC Pool - hUSDC"];
    else if (poolAddress == XdaiAmm.DAI)
      return ["HOP-DAI", "hDAI/DAI Pool - DAI", "hDAI/DAI Pool - hDAI"];
    else if (poolAddress == XdaiAmm.USDT)
      return ["HOP-USDT", "hUSDT/USDT Pool - USDT", "hUSDT/USDT Pool - hUSDT"];
    else if (poolAddress == XdaiAmm.ETH)
      return ["HOP-ETH", "hETH/ETH Pool - ETH", "hETH/ETH Pool - hETH"];
    else if (poolAddress == XdaiAmm.MATIC)
      return [
        "HOP-MATIC",
        "hMATIC/MATIC Pool - MATIC",
        "hMATIC/MATIC Pool - hMATIC",
      ];
    else {
      log.critical("Pool not found", []);
      return [];
    }
  }

  getPoolAddressFromRewardTokenAddress(rewardToken: string): string {
    if (rewardToken == XdaiRewardToken.USDC_A) return XdaiAmm.USDC;
    else if (rewardToken == XdaiRewardToken.USDC_B) return XdaiAmm.USDC;
    else if (rewardToken == XdaiRewardToken.USDT_A) return XdaiAmm.USDT;
    else if (rewardToken == XdaiRewardToken.USDT_B) return XdaiAmm.USDT;
    else if (rewardToken == XdaiRewardToken.ETH_A) return XdaiAmm.ETH;
    else if (rewardToken == XdaiRewardToken.ETH_B) return XdaiAmm.ETH;
    else if (rewardToken == XdaiRewardToken.DAI_A) return XdaiAmm.DAI;
    else if (rewardToken == XdaiRewardToken.DAI_B) return XdaiAmm.DAI;
    else {
      log.critical("Pool not found for reward token: {}", [rewardToken]);
      return "";
    }
  }

  getTokenList(): string[] {
    return [
      XdaiToken.USDC,
      XdaiToken.DAI,
      XdaiToken.USDT,
      XdaiToken.ETH,
      XdaiToken.MATIC,
    ];
  }
  getPoolsList(): string[] {
    return [
      XdaiAmm.USDC,
      XdaiAmm.DAI,
      XdaiAmm.USDT,
      XdaiAmm.MATIC,
      XdaiAmm.ETH,
    ];
  }
  getBridgeList(): string[] {
    return [
      XdaiBridge.USDC,
      XdaiBridge.DAI,
      XdaiBridge.MATIC,
      XdaiBridge.USDT,
      XdaiBridge.ETH,
    ];
  }

  getRewardTokenList(): string[] {
    return [
      XdaiRewardToken.DAI_A,
      XdaiRewardToken.DAI_B,
      XdaiRewardToken.ETH_A,
      XdaiRewardToken.ETH_B,
      XdaiRewardToken.USDC_A,
      XdaiRewardToken.USDC_B,
      XdaiRewardToken.USDT_A,
      XdaiRewardToken.USDT_B,
    ];
  }

  getXdaiCrossTokenFromTokenAddress(tokenAddress: string): string {
    return tokenAddress;
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

  getPoolAddressFromChainId(chainId: string, bridgeAddress: string): string {
    return chainId || bridgeAddress;
  }

  getUsdcPools(): string[] {
    return [];
  }
  getUsdcTokens(): string[] {
    return [XdaiToken.USDC, XdaiHtoken.USDC];
  }
  getDaiPools(): string[] {
    return [];
  }
  getDaiTokens(): string[] {
    return [XdaiToken.DAI, XdaiHtoken.DAI];
  }
  getUsdtPools(): string[] {
    return [];
  }
  getUsdtTokens(): string[] {
    return [XdaiToken.USDT, XdaiHtoken.USDT];
  }
  getEthPools(): string[] {
    return [];
  }
  getEthTokens(): string[] {
    return [
      XdaiToken.ETH,
      XdaiHtoken.ETH,
      ArbitrumNovaToken.ETH,
      ArbitrumNovaHtoken.ETH,
    ];
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
  getMaticTokens(): string[] {
    return [XdaiToken.MATIC, XdaiHtoken.MATIC];
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
