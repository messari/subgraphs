import { Address } from "@graphprotocol/graph-ts";
import { Network } from "./sdk/util/constants";

export const ETH_ADDRESS_OPTIMISM =
  "0xdeaddeaddeaddeaddeaddeaddeaddeaddead0000";

export const WETH_ADDRESS_OPTIMISM =
  "0x4200000000000000000000000000000000000006";

export const BRIDGE_ADDRESS = new Map<string, string>();
BRIDGE_ADDRESS.set(
  Network.MAINNET,
  "0x99c9fc46f92e8a1c0dec1b1747d010903e884be1"
);
BRIDGE_ADDRESS.set(
  Network.OPTIMISM,
  "0x4200000000000000000000000000000000000010"
);

export const EXCLUDED_MESSAGE_SENDERS = new Set<Address>();
EXCLUDED_MESSAGE_SENDERS.add(
  Address.fromString("0x99c9fc46f92e8a1c0dec1b1747d010903e884be1")
);
EXCLUDED_MESSAGE_SENDERS.add(
  Address.fromString("0xaba2c5f108f7e820c049d5af70b16ac266c8f128")
);
EXCLUDED_MESSAGE_SENDERS.add(
  Address.fromString("0x10e6593cdda8c58a1d0f14c5164b376352a55f2f")
);
EXCLUDED_MESSAGE_SENDERS.add(
  Address.fromString("0xc5b1ec605738ef73a4efc562274c1c0b6609cf59")
);
EXCLUDED_MESSAGE_SENDERS.add(
  Address.fromString("0x76943c0d61395d8f2edf9060e1533529cae05de6")
);
EXCLUDED_MESSAGE_SENDERS.add(
  Address.fromString("0x39ea01a0298c315d149a490e34b59dbf2ec7e48f")
);
EXCLUDED_MESSAGE_SENDERS.add(
  Address.fromString("0x4200000000000000000000000000000000000010")
);
EXCLUDED_MESSAGE_SENDERS.add(
  Address.fromString("0x158f513096923ff2d3aab2bcf4478536de6725e2")
);
EXCLUDED_MESSAGE_SENDERS.add(
  Address.fromString("0x467194771dae2967aef3ecbedd3bf9a310c76c65")
);
EXCLUDED_MESSAGE_SENDERS.add(
  Address.fromString("0xc76cbfbafd41761279e3edb23fd831ccb74d5d67")
);
EXCLUDED_MESSAGE_SENDERS.add(
  Address.fromString("0x8e01013243a96601a86eb3153f0d9fa4fbfb6957")
);
EXCLUDED_MESSAGE_SENDERS.add(
  Address.fromString("0x136b1ec699c62b0606854056f02dc7bb80482d63")
);

export const SNX_ADDRESS_MAINNET = Address.fromString(
  "0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f"
);
export const SNX_ADDRESS_OPTIMISM = Address.fromString(
  "0x8700daec35af8ff88c16bdf0418774cb3d7599b4"
);

export const SUSD_ADDRESS_MAINNET = Address.fromString(
  "0x57ab1ec28d129707052df4df418d58a2d46d5f51"
);
export const SUSD_ADDRESS_OPTIMISM = Address.fromString(
  "0x8c6f28f2f1a3c87f0f938b96d27520d9751ec8d9"
);
