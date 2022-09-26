import { BigDecimal, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { Delegate, GovernanceFramework, Vote } from "../generated/schema";
import { BIGDECIMAL_ZERO, BIGINT_ZERO, GOVERNANCE_TYPE, MKR_TOKEN } from "./constants";

export function hexToNumberString(hex: string): string {
  let hexNumber = BigInt.fromI32(0);
  if (hex.startsWith("0x")) {
    hex = hex.slice(2);
  }
  for (let i = 0; i < hex.length; i += 1) {
    let character = hex.substr(hex.length - 1 - i, 1);
    let digit = parseInt(character, 16) as u8;
    if (digit) {
      hexNumber = hexNumber.plus(
        BigInt.fromI32(digit).times(BigInt.fromI32(16).pow(i as u8))
      );
    }
  }

  return hexNumber.toString();
}

export function toDecimal(value: BigInt, decimals: number = 18): BigDecimal {
  return value.divDecimal(
    BigInt.fromI32(10)
      .pow(<u8>decimals)
      .toBigDecimal()
  );
}

export function getDelegate(address: string): Delegate {
  let delegate = Delegate.load(address);
  if (!delegate) {
    delegate = new Delegate(address);
    delegate.isVoteDelegate = false;
    delegate.votingPowerRaw = BIGINT_ZERO;
    delegate.votingPower = BIGDECIMAL_ZERO;
    delegate.delegations = [];
    delegate.tokenHoldersRepresented = 0;
    delegate.numberVotes = 0;
  }
  return delegate;
}

export function getGovernanceFramework(contractAddress: string): GovernanceFramework {
  let framework = GovernanceFramework.load(contractAddress);
  if (!framework) {
    framework = new GovernanceFramework(contractAddress)
    framework.name = "MakerGovernance"
    framework.type = GOVERNANCE_TYPE
    framework.tokenAddress = MKR_TOKEN
    framework.totalTokenSupply = BIGINT_ZERO //TODO
    framework.currentTokenHolders = BIGINT_ZERO //TODO
    framework.currentDelegates = BIGINT_ZERO //TODO

    framework.currentTokenLockedInChief = BIGINT_ZERO //TODO
    framework.currentTokenDelegated = BIGINT_ZERO //TODO
    framework.spells = 0
  }
  return framework
}