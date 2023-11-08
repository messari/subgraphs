import { log } from "@graphprotocol/graph-ts";
import { Configurations } from "../../../../../configurations/configurations/interface";
import {
  ArbitrumToken,
  ArbitrumAmm,
  MainnetToken,
  MainnetBridge,
  OptimismToken,
  XdaiAmm,
  XdaiToken,
  PolygonToken,
  PolygonAmm,
  OptimismAmm,
  ArbitrumNovaHtoken,
  ArbitrumNovaToken,
  ArbitrumNovaAmm,
  BaseToken,
  BaseAmm,
  LineaAmm,
  LineaToken,
} from "../../../../../src/sdk/util/constants";
import { Network } from "../../../../../src/sdk/util/constants";

export class HopProtocolEthereumConfigurations implements Configurations {
  getNetwork(): string {
    return Network.MAINNET;
  }

  getTokenDetails(tokenAddress: string): string[] {
    if (this.getUsdcTokens().includes(tokenAddress)) {
      return ["USDC", "USD Coin", "6", MainnetBridge.USDC];
    } else if (this.getMaticTokens().includes(tokenAddress)) {
      return ["MATIC", "Matic", "18", MainnetBridge.MATIC];
    } else if (this.getDaiTokens().includes(tokenAddress)) {
      return ["DAI", "DAI Stablecoin", "18", MainnetBridge.DAI];
    } else if (this.getUsdtTokens().includes(tokenAddress)) {
      return ["USDT", "Tether USD", "6", MainnetBridge.USDT];
    } else if (this.getMagicTokens().includes(tokenAddress)) {
      return ["MAGIC", "MAGIC", "18", MainnetBridge.MAGIC];
    } else if (this.getSnxTokens().includes(tokenAddress)) {
      return ["SNX", "SNX", "18", MainnetBridge.SNX];
    } else if (this.getEthTokens().includes(tokenAddress)) {
      return ["ETH", "Ethereum", "18", MainnetBridge.ETH];
    } else if (this.getsUSDTokens().includes(tokenAddress)) {
      return ["sUSD", "Synthetix Usd", "18", MainnetBridge.sUSD];
    } else if (this.getRethTokens().includes(tokenAddress)) {
      return ["rETH", "Rocket Pool Ethereum", "18", MainnetBridge.rETH];
    } else {
      log.critical("Token details not found", []);
      return [];
    }
  }

  getPoolDetails(poolAddress: string): string[] {
    if (this.getUsdcPools().includes(poolAddress)) {
      return ["HOP-USDC", "hUSDC/USDC"];
    } else if (this.getMaticPools().includes(poolAddress)) {
      return ["HOP-MATIC", "hMATIC/MATIC"];
    } else if (this.getDaiPools().includes(poolAddress)) {
      return ["HOP-DAI", "hDAI/DAI"];
    } else if (this.getUsdtPools().includes(poolAddress)) {
      return ["HOP-USDT", "hUSDT/USDT"];
    } else if (this.getSnxPools().includes(poolAddress)) {
      return ["HOP-SNX", "hSNX/SNX"];
    } else if (this.getEthPools().includes(poolAddress)) {
      return ["HOP-ETH", "hETH/ETH"];
    } else if (this.getMagicPools().includes(poolAddress)) {
      return ["HOP-MAGIC", "hMAGIC/MAGIC"];
    } else if (this.getRethPools().includes(poolAddress)) {
      return ["HOP-rETH", "hrETH/ETH"];
    } else if (this.getsUSDPools().includes(poolAddress)) {
      return ["HOP-sUSD", "hsUSD/sUSD"];
    } else {
      log.critical("Pool not found", []);
      return [];
    }
  }

  getRewardTokenList(): string[] {
    return [];
  }
  getPoolAddressFromRewardTokenAddress(rewardToken: string): string {
    return rewardToken;
  }

  getArbitrumNovaConfigFromTokenAddress(tokenAddress: string): string[] {
    if (tokenAddress == MainnetToken.ETH)
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
    else if (tokenAddress == MainnetToken.MAGIC)
      return [
        ArbitrumNovaToken.MAGIC,
        ArbitrumNovaHtoken.MAGIC,
        "HOP-MAGIC",
        "hMAGIC/MAGIC Nova Pool - MAGIC",
        "hMAGIC/MAGIC Nova Pool - hMAGIC",
        ArbitrumNovaAmm.MAGIC,
        this.getTokenDetails(tokenAddress)[0],
        this.getTokenDetails(tokenAddress)[1],
        this.getTokenDetails(tokenAddress)[2],
      ];
    else {
      log.critical("Config not found", []);
    }
    return [""];
  }

  getTokenAddressFromBridgeAddress(bridgeAddress: string): string[] {
    if (bridgeAddress == MainnetBridge.USDC) return [MainnetToken.USDC];
    else if (bridgeAddress == MainnetBridge.DAI) return [MainnetToken.DAI];
    else if (bridgeAddress == MainnetBridge.USDT) return [MainnetToken.USDT];
    else if (bridgeAddress == MainnetBridge.ETH) return [MainnetToken.ETH];
    else if (bridgeAddress == MainnetBridge.SNX) return [MainnetToken.SNX];
    else if (bridgeAddress == MainnetBridge.rETH) return [MainnetToken.rETH];
    else if (bridgeAddress == MainnetBridge.sUSD) return [MainnetToken.sUSD];
    else if (bridgeAddress == MainnetBridge.MATIC) return [MainnetToken.MATIC];
    else if (bridgeAddress == MainnetBridge.MAGIC) return [MainnetToken.MAGIC];
    else {
      log.critical("Bridge not found", []);
      return [""];
    }
  }

  getArbitrumPoolAddressFromBridgeAddress(bridgeAddress: string): string {
    if (bridgeAddress == MainnetBridge.USDC) return ArbitrumAmm.USDC;
    else if (bridgeAddress == MainnetBridge.DAI) return ArbitrumAmm.DAI;
    else if (bridgeAddress == MainnetBridge.USDT) return ArbitrumAmm.USDT;
    else if (bridgeAddress == MainnetBridge.ETH) return ArbitrumAmm.ETH;
    else if (bridgeAddress == MainnetBridge.rETH) return ArbitrumAmm.rETH;
    else if (bridgeAddress == MainnetBridge.MAGIC) return ArbitrumAmm.MAGIC;
    else {
      log.critical("Bridge not found", []);

      return "";
    }
  }

  getArbitrumNovaPoolAddressFromBridgeAddress(bridgeAddress: string): string {
    if (bridgeAddress == MainnetBridge.ETH) return ArbitrumNovaAmm.ETH;
    else if (bridgeAddress == MainnetBridge.MAGIC) return ArbitrumNovaAmm.MAGIC;
    else {
      log.critical("Bridge not found", []);
      return "";
    }
  }
  getPolygonPoolAddressFromBridgeAddress(bridgeAddress: string): string {
    if (bridgeAddress == MainnetBridge.USDC) return PolygonAmm.USDC;
    else if (bridgeAddress == MainnetBridge.DAI) return PolygonAmm.DAI;
    else if (bridgeAddress == MainnetBridge.USDT) return PolygonAmm.USDT;
    else if (bridgeAddress == MainnetBridge.MATIC) return PolygonAmm.MATIC;
    else if (bridgeAddress == MainnetBridge.ETH) return PolygonAmm.ETH;
    else {
      log.critical("Polygon Pool not found", []);

      return "";
    }
  }

  getXdaiPoolAddressFromBridgeAddress(bridgeAddress: string): string {
    if (bridgeAddress == MainnetBridge.USDC) return XdaiAmm.USDC;
    else if (bridgeAddress == MainnetBridge.DAI) return XdaiAmm.DAI;
    else if (bridgeAddress == MainnetBridge.USDT) return XdaiAmm.USDT;
    else if (bridgeAddress == MainnetBridge.ETH) return XdaiAmm.ETH;
    else if (bridgeAddress == MainnetBridge.MATIC) return XdaiAmm.MATIC;
    else {
      log.critical("Xdai Pool not found", []);

      return "";
    }
  }

  getOptimismPoolAddressFromBridgeAddress(bridgeAddress: string): string {
    if (bridgeAddress == MainnetBridge.USDC) return OptimismAmm.USDC;
    else if (bridgeAddress == MainnetBridge.DAI) return OptimismAmm.DAI;
    else if (bridgeAddress == MainnetBridge.USDT) return OptimismAmm.USDT;
    else if (bridgeAddress == MainnetBridge.ETH) return OptimismAmm.ETH;
    else if (bridgeAddress == MainnetBridge.SNX) return OptimismAmm.SNX;
    else if (bridgeAddress == MainnetBridge.sUSD) return OptimismAmm.sUSD;
    else if (bridgeAddress == MainnetBridge.rETH) return OptimismAmm.rETH;
    else {
      log.critical("Optimism Pool not found", []);

      return "";
    }
  }

  getBasePoolAddressFromBridgeAddress(bridgeAddress: string): string {
    if (bridgeAddress == MainnetBridge.USDC) return BaseAmm.USDC;
    if (bridgeAddress == MainnetBridge.ETH) return BaseAmm.ETH;
    else {
      log.critical("Base Pool not found for bridge: {}", [bridgeAddress]);

      return "";
    }
  }

  getLineaPoolAddressFromBridgeAddress(bridgeAddress: string): string {
    if (bridgeAddress == MainnetBridge.ETH) return LineaAmm.ETH;
    else {
      log.critical("Linea Pool not found for bridge: {}", [bridgeAddress]);

      return "";
    }
  }

  getPoolAddressFromChainId(chainId: string, bridgeAddress: string): string {
    if (chainId == "42161") {
      return this.getArbitrumPoolAddressFromBridgeAddress(bridgeAddress); //Arbitrum
    } else if (chainId == "10") {
      return this.getOptimismPoolAddressFromBridgeAddress(bridgeAddress); //Optimism
    } else if (chainId == "100") {
      return this.getXdaiPoolAddressFromBridgeAddress(bridgeAddress); //Xdai
    } else if (chainId == "137") {
      return this.getPolygonPoolAddressFromBridgeAddress(bridgeAddress); //Polygon
    } else if (chainId == "42170") {
      return this.getArbitrumNovaPoolAddressFromBridgeAddress(bridgeAddress); //Arbitrum Nova
    } else if (chainId == "8453") {
      return this.getBasePoolAddressFromBridgeAddress(bridgeAddress); //Base
    } else if (chainId == "59144") {
      return this.getLineaPoolAddressFromBridgeAddress(bridgeAddress); //Linea
    } else {
      log.critical("Chain not found: {}", [chainId]);
      return "";
    }
  }

  getTokenList(): string[] {
    return [
      MainnetToken.USDC,
      MainnetToken.DAI,
      MainnetToken.USDT,
      MainnetToken.ETH,
      MainnetToken.MATIC,
      MainnetToken.SNX,
    ];
  }

  getUsdcPools(): string[] {
    return [
      PolygonAmm.USDC,
      XdaiAmm.USDC,
      ArbitrumAmm.USDC,
      OptimismAmm.USDC,
      BaseAmm.USDC,
    ];
  }

  getUsdcTokens(): string[] {
    return [
      PolygonToken.USDC,
      XdaiToken.USDC,
      ArbitrumToken.USDC,
      OptimismToken.USDC,
      MainnetToken.USDC,
      BaseToken.USDC,
    ];
  }
  getDaiPools(): string[] {
    return [PolygonAmm.DAI, XdaiAmm.DAI, ArbitrumAmm.DAI, OptimismAmm.DAI];
  }
  getDaiTokens(): string[] {
    return [
      PolygonToken.DAI,
      XdaiToken.DAI,
      ArbitrumToken.DAI,
      MainnetToken.DAI,
      OptimismToken.DAI,
    ];
  }

  getUsdtPools(): string[] {
    return [PolygonAmm.USDT, XdaiAmm.USDT, ArbitrumAmm.USDT, OptimismAmm.USDT];
  }
  getUsdtTokens(): string[] {
    return [
      MainnetToken.USDT,
      ArbitrumToken.USDT,
      PolygonToken.USDT,
      OptimismToken.USDT,
      XdaiToken.USDT,
    ];
  }

  getEthPools(): string[] {
    return [
      ArbitrumNovaAmm.ETH,
      XdaiAmm.ETH,
      ArbitrumAmm.ETH,
      PolygonAmm.ETH,
      OptimismAmm.ETH,
      BaseAmm.ETH,
      LineaAmm.ETH,
    ];
  }

  getEthTokens(): string[] {
    return [
      MainnetToken.ETH,
      XdaiToken.ETH,
      ArbitrumToken.ETH,
      PolygonToken.ETH,
      OptimismToken.ETH,
      ArbitrumNovaToken.ETH,
      BaseToken.ETH,
      LineaToken.ETH,
    ];
  }

  getSnxPools(): string[] {
    return [OptimismAmm.SNX];
  }
  getSnxTokens(): string[] {
    return [MainnetToken.SNX, OptimismToken.SNX];
  }

  getRethPools(): string[] {
    return [ArbitrumAmm.rETH, OptimismAmm.rETH];
  }
  getRethTokens(): string[] {
    return [MainnetToken.rETH, OptimismToken.rETH, ArbitrumToken.rETH];
  }

  getsUSDPools(): string[] {
    return [OptimismAmm.sUSD];
  }
  getsUSDTokens(): string[] {
    return [MainnetToken.sUSD, OptimismToken.sUSD];
  }

  getMaticPools(): string[] {
    return [PolygonAmm.MATIC, XdaiAmm.MATIC];
  }
  getMaticTokens(): string[] {
    return [PolygonToken.MATIC, XdaiToken.MATIC, MainnetToken.MATIC];
  }
  getMagicTokens(): string[] {
    return [MainnetToken.MAGIC, ArbitrumToken.MAGIC, ArbitrumNovaToken.MAGIC];
  }
  getMagicPools(): string[] {
    return [ArbitrumAmm.MAGIC, ArbitrumNovaAmm.MAGIC];
  }

  getBridgeList(): string[] {
    return [
      MainnetBridge.USDC,
      MainnetBridge.DAI,
      MainnetBridge.USDT,
      MainnetBridge.ETH,
      MainnetBridge.MATIC,
      MainnetBridge.SNX,
      MainnetBridge.rETH,
      MainnetBridge.sUSD,
      MainnetBridge.MAGIC,
    ];
  }

  getPoolsList(): string[] {
    return [];
  }

  getTokenAddressFromPoolAddress(poolAddress: string): string[] {
    return [poolAddress];
  }
  getPoolAddressFromTokenAddress(tokenAddress: string): string {
    return tokenAddress;
  }
  getPoolAddressFromBridgeAddress(bridgeAddress: string): string {
    return bridgeAddress;
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
    else if (chainId == "42170")
      return this.getArbitrumNovaConfigFromTokenAddress(tokenAddress)[0];
    else if (chainId == "1")
      return this.getMainnetCrossTokenFromTokenAddress(tokenAddress);
    else if (chainId == "8453")
      return this.getBaseCrossTokenFromTokenAddress(tokenAddress);
    else if (chainId == "59144")
      return this.getLineaCrossTokenFromTokenAddress(tokenAddress);
    else {
      log.critical("Chain not found: {}", [chainId]);
      return "";
    }
  }

  getArbitrumCrossTokenFromTokenAddress(tokenAddress: string): string {
    if (tokenAddress == MainnetToken.USDC) return ArbitrumToken.USDC;
    else if (tokenAddress == MainnetToken.DAI) return ArbitrumToken.DAI;
    else if (tokenAddress == MainnetToken.USDT) return ArbitrumToken.USDT;
    else if (tokenAddress == MainnetToken.ETH) return ArbitrumToken.ETH;
    else if (tokenAddress == MainnetToken.rETH) return ArbitrumToken.rETH;
    else if (tokenAddress == MainnetToken.MAGIC) return ArbitrumToken.MAGIC;
    else {
      log.critical("Arb Crosstoken not found", []);
      return "";
    }
  }
  getPolygonCrossTokenFromTokenAddress(tokenAddress: string): string {
    if (tokenAddress == MainnetToken.USDC) return PolygonToken.USDC;
    else if (tokenAddress == MainnetToken.DAI) return PolygonToken.DAI;
    else if (tokenAddress == MainnetToken.USDT) return PolygonToken.USDT;
    else if (tokenAddress == MainnetToken.ETH) return PolygonToken.ETH;
    else if (tokenAddress == MainnetToken.MATIC) return PolygonToken.MATIC;
    else {
      log.critical("Polygon Crosstoken not found", []);
      return "";
    }
  }
  getOptimismCrossTokenFromTokenAddress(tokenAddress: string): string {
    if (tokenAddress == MainnetToken.USDC) return OptimismToken.USDC;
    else if (tokenAddress == MainnetToken.DAI) return OptimismToken.DAI;
    else if (tokenAddress == MainnetToken.USDT) return OptimismToken.USDT;
    else if (tokenAddress == MainnetToken.ETH) return OptimismToken.ETH;
    else if (tokenAddress == MainnetToken.SNX) return OptimismToken.SNX;
    else if (tokenAddress == MainnetToken.rETH) return OptimismToken.rETH;
    else if (tokenAddress == MainnetToken.sUSD) return OptimismToken.sUSD;
    else {
      log.critical("Optimism Crosstoken not found", []);
      return "";
    }
  }
  getXdaiCrossTokenFromTokenAddress(tokenAddress: string): string {
    if (tokenAddress == MainnetToken.USDC) return XdaiToken.USDC;
    else if (tokenAddress == MainnetToken.DAI) return XdaiToken.DAI;
    else if (tokenAddress == MainnetToken.USDT) return XdaiToken.USDT;
    else if (tokenAddress == MainnetToken.ETH) return XdaiToken.ETH;
    else if (tokenAddress == MainnetToken.MATIC) return XdaiToken.MATIC;
    else {
      log.critical("Xdai Crosstoken not found", []);
      return "";
    }
  }
  getBaseCrossTokenFromTokenAddress(tokenAddress: string): string {
    if (tokenAddress == MainnetToken.USDC) return BaseToken.USDC;
    if (tokenAddress == MainnetToken.ETH) return BaseToken.ETH;
    else {
      log.critical("Base CrossToken not found for token: {}", [tokenAddress]);
      return "";
    }
  }
  getLineaCrossTokenFromTokenAddress(tokenAddress: string): string {
    if (tokenAddress == MainnetToken.ETH) return LineaToken.ETH;
    else {
      log.critical("Linea CrossToken not found for token: {}", [tokenAddress]);
      return "";
    }
  }

  getMainnetCrossTokenFromTokenAddress(tokenAddress: string): string {
    log.critical("Mainnet cross token not found", []);
    return tokenAddress;
  }
}
