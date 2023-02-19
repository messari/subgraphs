import { BigDecimal, BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";
import {
  Delegate,
  GovernanceFramework,
  Spell,
  Slate,
  DelegateVotingPowerChange,
} from "../generated/schema";
import { DSChief } from "../generated/DSChief/DSChief";
import { DSSpell } from "../generated/DSChief/DSSpell";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  GOVERNANCE_TYPE,
  MKR_TOKEN,
  SpellState,
  ZERO_ADDRESS,
} from "./constants";
import { DSSpell as DSSpellTemplate } from "../generated/templates";

export function hexToNumberString(hex: string): string {
  let hexNumber = BigInt.fromI32(0);
  if (hex.startsWith("0x")) {
    hex = hex.slice(2);
  }
  for (let i = 0; i < hex.length; i += 1) {
    const character = hex.substr(hex.length - 1 - i, 1);
    const digit = parseInt(character, 16) as u8;
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
    delegate.currentSpells = [];
    delegate.numberVotes = 0;
    delegate.numberPoleVotes = 0;
  }
  return delegate;
}

export function createDelegateVotingPowerChange(
  event: ethereum.Event,
  previousBalance: BigInt,
  newBalance: BigInt,
  delegate: string
): DelegateVotingPowerChange {
  const delegateVotingPwerChangeId = `${event.block.timestamp.toI64()}-${
    event.logIndex
  }`;
  const delegateVPChange = new DelegateVotingPowerChange(
    delegateVotingPwerChangeId
  );
  delegateVPChange.previousBalance = previousBalance;
  delegateVPChange.newBalance = newBalance;
  delegateVPChange.delegate = delegate;
  delegateVPChange.tokenAddress = event.address.toHexString();
  delegateVPChange.txnHash = event.transaction.hash.toHexString();
  delegateVPChange.blockTimestamp = event.block.timestamp;
  delegateVPChange.logIndex = event.logIndex;
  delegateVPChange.blockNumber = event.block.number;
  return delegateVPChange;
}

export function getGovernanceFramework(
  contractAddress: string
): GovernanceFramework {
  let framework = GovernanceFramework.load(contractAddress);
  if (!framework) {
    framework = new GovernanceFramework(contractAddress);
    framework.name = "MakerGovernance";
    framework.type = GOVERNANCE_TYPE;
    framework.tokenAddress = MKR_TOKEN;
    framework.totalTokenSupply = BIGINT_ZERO; //TODO
    framework.currentTokenHolders = BIGINT_ZERO; //TODO
    framework.totalDelegates = 0;
    framework.currentTokenLockedInChief = BIGINT_ZERO;
    framework.currentTokenDelegated = BIGINT_ZERO; //TODO
    framework.spells = 0;
  }
  return framework;
}

export function createSlate(slateID: Bytes, event: ethereum.Event): Slate {
  const slate = new Slate(slateID.toHexString());
  slate.yays = [];
  slate.txnHash = event.transaction.hash.toHexString();
  slate.creationBlock = event.block.number;
  slate.creationTime = event.block.timestamp;

  let newSpellCount = 0;
  let i = 0;
  const dsChief = DSChief.bind(event.address);
  let slateResponse = dsChief.try_slates(slateID, BigInt.fromI32(i));
  while (!slateResponse.reverted) {
    const spellAddress = slateResponse.value;

    const spellID = spellAddress.toHexString();
    let spell = Spell.load(spellID);
    if (!spell && spellID != ZERO_ADDRESS) {
      spell = new Spell(spellID);
      spell.description = "";
      spell.state = SpellState.ACTIVE;
      spell.creationBlock = event.block.number;
      spell.creationTime = event.block.timestamp;

      const dsSpell = DSSpell.bind(spellAddress);
      const dsDescription = dsSpell.try_description();
      if (!dsDescription.reverted) {
        spell.description = dsDescription.value;
      }
      const expiration = dsSpell.try_expiration();
      if (!expiration.reverted) {
        spell.expiryTime = expiration.value;
        spell.governanceFramework = event.address.toHexString();
        spell.totalVotes = BIGINT_ZERO;
        spell.totalWeightedVotes = BIGINT_ZERO;
        spell.save();

        // Track this new spell
        DSSpellTemplate.create(spellAddress);

        newSpellCount = newSpellCount + 1;
      }
    }
    slate.yays = slate.yays.concat([spellID]);
    // loop through slate indices until a revert breaks it
    slateResponse = dsChief.try_slates(slateID, BigInt.fromI32(++i));
  }
  // Update framework spell count
  const framework = getGovernanceFramework(event.address.toHexString());
  framework.spells = framework.spells + newSpellCount;
  framework.save();

  slate.save();
  return slate;
}

export function addWeightToSpells(spellIDs: string[], weight: BigInt): void {
  for (let i = 0; i < spellIDs.length; i++) {
    const spell = Spell.load(spellIDs[i]);
    if (spell) {
      spell.totalWeightedVotes = spell.totalWeightedVotes.plus(weight);
      spell.save();
    }
  }
}
export function removeWeightFromSpells(
  spellIDs: string[],
  weight: BigInt
): void {
  for (let i = 0; i < spellIDs.length; i++) {
    const spell = Spell.load(spellIDs[i]);
    if (spell) {
      spell.totalWeightedVotes = spell.totalWeightedVotes.minus(weight);
      spell.save();
    }
  }
}
