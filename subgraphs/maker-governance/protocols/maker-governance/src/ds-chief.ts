import { BigInt, Bytes, Address, ethereum, log } from "@graphprotocol/graph-ts";
import { LogNote, Etch } from "../../../generated/DSChief/DSChief";
import { VoteDelegate } from "../../../generated/DSChief/VoteDelegate";
import {
  Slate,
  Spell,
  Vote,
  Delegate,
  DelegateAdmin,
} from "../../../generated/schema";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ONE,
  BIGINT_ZERO,
  SpellState,
} from "../../../src/constants";
import {
  addWeightToSpells,
  createDelegateVotingPowerChange,
  createSlate,
  getDelegate,
  getGovernanceFramework,
  hexToNumberString,
  removeWeightFromSpells,
  toDecimal,
} from "../../../src/helpers";
import { VoteDelegate as VoteDelegateTemplate } from "../../../generated/templates";

export function handleLock(event: LogNote): void {
  const sender = event.params.guy; // guy is the sender
  const amountStr = hexToNumberString(event.params.foo.toHexString());
  const amount = BigInt.fromString(amountStr); //.foo is the amount being locked

  let newDelegateCount = 0;
  let delegate = Delegate.load(sender.toHexString());
  if (!delegate) {
    delegate = new Delegate(sender.toHexString());
    delegate.isVoteDelegate = false;
    delegate.votingPowerRaw = BIGINT_ZERO;
    delegate.votingPower = BIGDECIMAL_ZERO;
    delegate.delegations = [];
    delegate.tokenHoldersRepresented = 0;
    delegate.currentSpells = [];
    delegate.numberVotes = 0;
    delegate.numberPoleVotes = 0;

    // Check if vote delegate contract by calling chief()
    const voteDelegate = VoteDelegate.bind(sender);
    const res = voteDelegate.try_delegate();
    // will revert if not a contract
    if (!res.reverted) {
      // Save delegate admin to identify proxy votes later
      const delegateAdmin = new DelegateAdmin(res.value.toHexString());
      delegateAdmin.voteDelegate = delegate.id;
      delegateAdmin.save();

      // Track this new vote delegate contract
      VoteDelegateTemplate.create(sender);

      delegate.isVoteDelegate = true;
      newDelegateCount = 1;
    }
  }

  const delegateVPChange = createDelegateVotingPowerChange(
    event,
    delegate.votingPowerRaw,
    delegate.votingPowerRaw.plus(amount),
    delegate.id
  );
  delegateVPChange.save();

  delegate.votingPowerRaw = delegate.votingPowerRaw.plus(amount);
  delegate.votingPower = delegate.votingPower.plus(toDecimal(amount));
  addWeightToSpells(delegate.currentSpells, amount);
  delegate.save();

  const framework = getGovernanceFramework(event.address.toHexString());
  framework.currentTokenLockedInChief =
    framework.currentTokenLockedInChief.plus(amount);
  framework.totalDelegates = framework.totalDelegates + newDelegateCount;
  framework.save();
}

export function handleFree(event: LogNote): void {
  const sender = event.params.guy; // guy is the sender
  const amountStr = hexToNumberString(event.params.foo.toHexString());
  const amount = BigInt.fromString(amountStr); //.foo is the amount being locked

  const delegate = getDelegate(sender.toHexString());

  const delegateVPChange = createDelegateVotingPowerChange(
    event,
    delegate.votingPowerRaw,
    delegate.votingPowerRaw.minus(amount),
    delegate.id
  );
  delegateVPChange.save();

  delegate.votingPowerRaw = delegate.votingPowerRaw.minus(amount);
  delegate.votingPower = delegate.votingPower.minus(toDecimal(amount));
  removeWeightFromSpells(delegate.currentSpells, amount);
  delegate.save();

  const framework = getGovernanceFramework(event.address.toHexString());
  framework.currentTokenLockedInChief =
    framework.currentTokenLockedInChief.minus(amount);
  framework.save();
}

export function handleVote(event: LogNote): void {
  const sender = event.params.guy.toHexString(); // guy is the sender
  const slateID = event.params.foo; // foo is slate id
  _handleSlateVote(sender, slateID, event);
}

export function handleEtch(event: Etch): void {
  let sender = event.transaction.from.toHexString();
  const to = event.transaction.to;
  // Check if txn is not directly to Chief, it's either to vote delegate or multi-sig + delegate
  if (to && to != event.address) {
    const fromAdmin = DelegateAdmin.load(sender);
    if (!fromAdmin) {
      const toAdmin = DelegateAdmin.load(to.toHexString());
      if (!toAdmin) {
        log.error("Etch not trigger by a delegate admin. TxnHash: {}", [
          event.transaction.hash.toHexString(),
        ]);
      } else {
        // Txn sent via a proxy/multi-sig to vote delegate
        sender = toAdmin.voteDelegate!;
      }
    } else {
      // Txn sent to vote delegate
      sender = fromAdmin.voteDelegate!;
    }
  }
  const slateID = event.params.slate;
  _handleSlateVote(sender, slateID, event);
}

function _handleSlateVote(
  sender: string,
  slateID: Bytes,
  event: ethereum.Event
): void {
  const delegate = getDelegate(sender);
  let slate = Slate.load(slateID.toHexString());
  if (!slate) {
    slate = createSlate(slateID, event);
  }

  // Remove votes from previous spells
  removeWeightFromSpells(delegate.currentSpells, delegate.votingPowerRaw);

  for (let i = 0; i < slate.yays.length; i++) {
    const spellID = slate.yays[i];
    const spell = Spell.load(spellID);
    if (spell) {
      const voteId = sender.concat("-").concat(spellID);
      const vote = new Vote(voteId);
      vote.weight = delegate.votingPowerRaw;
      vote.reason = "";
      vote.voter = sender;
      vote.spell = spellID;
      vote.block = event.block.number;
      vote.blockTime = event.block.timestamp;
      vote.txnHash = event.transaction.hash.toHexString();
      vote.logIndex = event.logIndex;
      vote.save();

      spell.totalVotes = spell.totalVotes.plus(BIGINT_ONE);
      spell.totalWeightedVotes = spell.totalWeightedVotes.plus(
        delegate.votingPowerRaw
      );
      spell.save();
    }
  }

  delegate.currentSpells = slate.yays;
  delegate.numberVotes = delegate.numberVotes + 1;
  delegate.save();
}

export function handleLift(event: LogNote): void {
  // foo is the spellID in bytes, we trim and convert to address
  const spellID = Address.fromString(event.params.foo.toHexString().slice(26));

  const spell = Spell.load(spellID.toHexString());
  if (!spell) return;
  spell.state = SpellState.LIFTED;
  spell.liftedTxnHash = event.transaction.hash.toHexString();
  spell.liftedBlock = event.block.number;
  spell.liftedTime = event.block.timestamp;
  spell.liftedWith = spell.totalWeightedVotes;
  spell.save();

  // Update governance framework everytime a spell is lifted
  const framework = getGovernanceFramework(event.address.toHexString());
  framework.currentHat = spell.id;
  framework.save();
}
