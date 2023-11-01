import { ERC20 } from "../../../../generated/Configurator/ERC20";
import { ERC20SymbolBytes } from "../../../../generated/Configurator/ERC20SymbolBytes";
import { ERC20NameBytes } from "../../../../generated/Configurator/ERC20NameBytes";
import { Address, BigDecimal, Bytes, ethereum } from "@graphprotocol/graph-ts";
import { RewardToken, Token } from "../../../../generated/schema";
import {
  BIGDECIMAL_ZERO,
  INT_EIGHTTEEN,
  INT_NINE,
  INT_ZERO,
  INT_SIXTEEN,
} from "./constants";

/**
 * This file contains the TokenClass, which acts as
 * a wrapper for the Token entity making it easier to
 * use in mappings and get info about the token.
 *
 * Schema Version:  3.1.1
 * SDK Version:     1.0.7
 * Author(s):
 *  - @melotik
 *  - @dhruv-chauhan
 */

export class TokenManager {
  private INVALID_TOKEN_DECIMALS: i32 = 0;
  private UNKNOWN_TOKEN_VALUE: string = "unknown";

  private token!: Token;
  private event!: ethereum.Event;

  constructor(
    tokenAddress: Bytes,
    event: ethereum.Event,
    tokenType: string | null = null
  ) {
    let _token = Token.load(tokenAddress);
    if (!_token) {
      _token = new Token(tokenAddress);
      _token.name = this.fetchTokenName(Address.fromBytes(tokenAddress));
      _token.symbol = this.fetchTokenSymbol(Address.fromBytes(tokenAddress));
      _token.decimals = this.fetchTokenDecimals(
        Address.fromBytes(tokenAddress)
      );
      if (tokenType) {
        _token.type = tokenType;
      }
      _token.save();
    }

    this.token = _token;
    this.event = event;
  }

  getToken(): Token {
    return this.token;
  }

  getDecimals(): i32 {
    return this.token.decimals;
  }

  updatePrice(newPriceUSD: BigDecimal): void {
    this.token.lastPriceBlockNumber = this.event.block.number;
    this.token.lastPriceUSD = newPriceUSD;
    this.token.save();
  }

  getPriceUSD(): BigDecimal {
    if (this.token.lastPriceUSD) {
      return this.token.lastPriceUSD!;
    }
    return BIGDECIMAL_ZERO;
  }

  ////////////////////
  ///// Creators /////
  ////////////////////

  getOrCreateRewardToken(rewardTokenType: string): RewardToken {
    const rewardTokenID = rewardTokenType
      .concat("-")
      .concat(this.token.id.toHexString());
    let rewardToken = RewardToken.load(rewardTokenID);
    if (!rewardToken) {
      rewardToken = new RewardToken(rewardTokenID);
      rewardToken.token = this.token.id;
      rewardToken.type = rewardTokenType;
      rewardToken.save();
    }
    return rewardToken;
  }

  private fetchTokenSymbol(tokenAddress: Address): string {
    const contract = ERC20.bind(tokenAddress);
    const contractSymbolBytes = ERC20SymbolBytes.bind(tokenAddress);

    // try types string and bytes32 for symbol
    let symbolValue = this.UNKNOWN_TOKEN_VALUE;
    const symbolResult = contract.try_symbol();
    if (!symbolResult.reverted) {
      return symbolResult.value;
    }

    // non-standard ERC20 implementation
    const symbolResultBytes = contractSymbolBytes.try_symbol();
    if (!symbolResultBytes.reverted) {
      // for broken pairs that have no symbol function exposed
      if (!this.isNullEthValue(symbolResultBytes.value.toHexString())) {
        symbolValue = symbolResultBytes.value.toString();
      } else {
        // try with the static definition
        const staticTokenDefinition =
          StaticTokenDefinition.fromAddress(tokenAddress);
        if (staticTokenDefinition != null) {
          symbolValue = staticTokenDefinition.symbol;
        }
      }
    }

    return symbolValue;
  }

  private fetchTokenName(tokenAddress: Address): string {
    const contract = ERC20.bind(tokenAddress);
    const contractNameBytes = ERC20NameBytes.bind(tokenAddress);

    // try types string and bytes32 for name
    let nameValue = this.UNKNOWN_TOKEN_VALUE;
    const nameResult = contract.try_name();
    if (!nameResult.reverted) {
      return nameResult.value;
    }

    // non-standard ERC20 implementation
    const nameResultBytes = contractNameBytes.try_name();
    if (!nameResultBytes.reverted) {
      // for broken exchanges that have no name function exposed
      if (!this.isNullEthValue(nameResultBytes.value.toHexString())) {
        nameValue = nameResultBytes.value.toString();
      } else {
        // try with the static definition
        const staticTokenDefinition =
          StaticTokenDefinition.fromAddress(tokenAddress);
        if (staticTokenDefinition != null) {
          nameValue = staticTokenDefinition.name;
        }
      }
    }

    return nameValue;
  }

  private fetchTokenDecimals(tokenAddress: Address): i32 {
    const contract = ERC20.bind(tokenAddress);

    // try types uint8 for decimals
    const decimalResult = contract.try_decimals();
    if (!decimalResult.reverted) {
      const decimalValue = decimalResult.value;
      return decimalValue;
    }

    // try with the static definition
    const staticTokenDefinition =
      StaticTokenDefinition.fromAddress(tokenAddress);
    if (staticTokenDefinition != null) {
      return staticTokenDefinition.decimals as i32;
    } else {
      return this.INVALID_TOKEN_DECIMALS as i32;
    }
  }

  private isNullEthValue(value: string): boolean {
    return (
      value ==
      "0x0000000000000000000000000000000000000000000000000000000000000001"
    );
  }
}

// Initialize a Token Definition with the attributes
export class StaticTokenDefinition {
  address: Address;
  symbol: string;
  name: string;
  decimals: i32;

  // Initialize a Token Definition with its attributes
  constructor(address: Address, symbol: string, name: string, decimals: i32) {
    this.address = address;
    this.symbol = symbol;
    this.name = name;
    this.decimals = decimals;
  }

  // Get all tokens with a static defintion
  static getStaticDefinitions(): Array<StaticTokenDefinition> {
    // https://thegraph.com/docs/en/release-notes/assemblyscript-migration-guide/#array-initialization
    const staticDefinitions = new Array<StaticTokenDefinition>(INT_ZERO);

    // Add DGD
    const tokenDGD = new StaticTokenDefinition(
      Address.fromString("0xe0b7927c4af23765cb51314a0e0521a9645f0e2a"),
      "DGD",
      "DGD",
      INT_NINE as i32
    );
    staticDefinitions.push(tokenDGD);

    // Add AAVE
    const tokenAAVE = new StaticTokenDefinition(
      Address.fromString("0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9"),
      "AAVE",
      "Aave Token",
      INT_EIGHTTEEN as i32
    );
    staticDefinitions.push(tokenAAVE);

    // Add LIF
    const tokenLIF = new StaticTokenDefinition(
      Address.fromString("0xeb9951021698b42e4399f9cbb6267aa35f82d59d"),
      "LIF",
      "Lif",
      INT_EIGHTTEEN as i32
    );
    staticDefinitions.push(tokenLIF);

    // Add SVD
    const tokenSVD = new StaticTokenDefinition(
      Address.fromString("0xbdeb4b83251fb146687fa19d1c660f99411eefe3"),
      "SVD",
      "savedroid",
      INT_EIGHTTEEN as i32
    );
    staticDefinitions.push(tokenSVD);

    // Add TheDAO
    const tokenTheDAO = new StaticTokenDefinition(
      Address.fromString("0xbb9bc244d798123fde783fcc1c72d3bb8c189413"),
      "TheDAO",
      "TheDAO",
      INT_SIXTEEN as i32
    );
    staticDefinitions.push(tokenTheDAO);

    // Add HPB
    const tokenHPB = new StaticTokenDefinition(
      Address.fromString("0x38c6a68304cdefb9bec48bbfaaba5c5b47818bb2"),
      "HPB",
      "HPBCoin",
      INT_EIGHTTEEN as i32
    );
    staticDefinitions.push(tokenHPB);

    return staticDefinitions;
  }

  // Helper for hardcoded tokens
  static fromAddress(tokenAddress: Address): StaticTokenDefinition | null {
    const staticDefinitions = this.getStaticDefinitions();

    // Search the definition using the address
    for (let i = 0; i < staticDefinitions.length; i++) {
      const staticDefinition = staticDefinitions[i];
      if (staticDefinition.address == tokenAddress) {
        return staticDefinition;
      }
    }

    // If not found, return null
    return null;
  }
}
