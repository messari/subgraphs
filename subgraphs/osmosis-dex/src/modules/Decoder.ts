import { Reader } from "as-proto";
import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import * as constants from "../common/constants";

export class MsgPoolParams {
  swapFee: BigDecimal;
  exitFee: BigDecimal;
  smoothWeightChangeParams: string | null;

  constructor(
    swapFee: BigDecimal = constants.BIGDECIMAL_ZERO,
    exitFee: BigDecimal = constants.BIGDECIMAL_ZERO,
    smoothWeightChangeParams: string | null = null
  ) {
    this.swapFee = swapFee;
    this.exitFee = exitFee;
    this.smoothWeightChangeParams = smoothWeightChangeParams;
  }

  static decode(reader: Reader, length: i32): MsgPoolParams {
    const end: usize = length < 0 ? reader.end : reader.ptr + length;
    const message = new MsgPoolParams();

    while (reader.ptr < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.swapFee = BigDecimal.fromString(reader.string());
          break;

        case 2:
          message.exitFee = BigDecimal.fromString(reader.string());
          break;

        case 3:
          message.smoothWeightChangeParams = reader.string();
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  }
}

export class MsgPoolAssets {
  token: MsgToken | null;
  weight: BigInt;

  constructor(
    token: MsgToken | null = null,
    weight: BigInt = constants.BIGINT_ZERO
  ) {
    this.token = token;
    this.weight = weight;
  }

  static decode(reader: Reader, length: i32): MsgPoolAssets {
    const end: usize = length < 0 ? reader.end : reader.ptr + length;
    const message = new MsgPoolAssets();

    while (reader.ptr < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.token = MsgToken.decode(reader, reader.uint32());
          break;

        case 2:
          message.weight = BigInt.fromString(reader.string());
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  }
}

export class MsgToken {
  denom: string;
  amount: BigInt;

  constructor(denom: string = "", amount: BigInt = constants.BIGINT_ZERO) {
    this.denom = denom;
    this.amount = amount;
  }

  static decode(reader: Reader, length: i32): MsgToken {
    const end: usize = length < 0 ? reader.end : reader.ptr + length;
    const message = new MsgToken();

    while (reader.ptr < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.denom = reader.string();
          break;

        case 2:
          message.amount = BigInt.fromString(reader.string());
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  }
}

export class MsgCreateBalancerPool {
  sender: string;
  poolParams: MsgPoolParams | null;
  poolAssets: Array<MsgPoolAssets>;
  future_pool_governor: string;

  constructor(
    sender: string = "",
    poolParams: MsgPoolParams | null = null,
    poolAssets: Array<MsgPoolAssets> = [],
    future_pool_governor: string = ""
  ) {
    this.sender = sender;
    this.poolParams = poolParams;
    this.poolAssets = poolAssets;
    this.future_pool_governor = future_pool_governor;
  }

  static decode(reader: Reader, length: i32): MsgCreateBalancerPool {
    const end: usize = length < 0 ? reader.end : reader.ptr + length;
    const message = new MsgCreateBalancerPool();

    while (reader.ptr < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.sender = reader.string();
          break;

        case 2:
          message.poolParams = MsgPoolParams.decode(reader, reader.uint32());
          break;

        case 3:
          message.poolAssets.push(
            MsgPoolAssets.decode(reader, reader.uint32())
          );
          break;

        case 4:
          message.future_pool_governor = reader.string();
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  }
}

export class MsgJoinPool {
  sender: string;
  poolId: BigInt;
  shareOutAmount: BigInt;
  tokenInMaxs: Array<MsgToken>;

  constructor(
    sender: string = "",
    poolId: BigInt = constants.BIGINT_ZERO,
    shareOutAmount: BigInt = constants.BIGINT_ZERO,
    tokenInMaxs: Array<MsgToken> = []
  ) {
    this.sender = sender;
    this.poolId = poolId;
    this.shareOutAmount = shareOutAmount;
    this.tokenInMaxs = tokenInMaxs;
  }

  static decode(reader: Reader, length: i32): MsgJoinPool {
    const end: usize = length < 0 ? reader.end : reader.ptr + length;
    const message = new MsgJoinPool();

    while (reader.ptr < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.sender = reader.string();
          break;

        case 2:
          message.poolId = BigInt.fromI32(reader.uint32());
          break;

        case 3:
          message.shareOutAmount = BigInt.fromString(reader.string());
          break;

        case 4:
          message.tokenInMaxs.push(MsgToken.decode(reader, reader.uint32()));
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  }
}

export class MsgJoinSwapExternAmountIn {
  sender: string;
  poolId: BigInt;
  tokenIn: MsgToken | null;
  shareOutMinAmount: BigInt;

  constructor(
    sender: string = "",
    poolId: BigInt = constants.BIGINT_ZERO,
    tokenIn: MsgToken | null = null,
    shareOutMinAmount: BigInt = constants.BIGINT_ZERO
  ) {
    this.sender = sender;
    this.poolId = poolId;
    this.tokenIn = tokenIn;
    this.shareOutMinAmount = shareOutMinAmount;
  }

  static decode(reader: Reader, length: i32): MsgJoinSwapExternAmountIn {
    const end: usize = length < 0 ? reader.end : reader.ptr + length;
    const message = new MsgJoinSwapExternAmountIn();

    while (reader.ptr < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.sender = reader.string();
          break;

        case 2:
          message.poolId = BigInt.fromI32(reader.uint32());
          break;

        case 3:
          message.tokenIn = MsgToken.decode(reader, reader.uint32());
          break;

        case 4:
          message.shareOutMinAmount = BigInt.fromString(reader.string());
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  }
}

export class MsgJoinSwapShareAmountOut {
  sender: string;
  poolId: BigInt;
  tokenInDenom: string;
  shareOutAmount: BigInt;
  tokenInMaxAmount: BigInt;

  constructor(
    sender: string = "",
    poolId: BigInt = constants.BIGINT_ZERO,
    tokenInDenom: string = "",
    shareOutAmount: BigInt = constants.BIGINT_ZERO,
    tokenInMaxAmount: BigInt = constants.BIGINT_ZERO
  ) {
    this.sender = sender;
    this.poolId = poolId;
    this.tokenInDenom = tokenInDenom;
    this.shareOutAmount = shareOutAmount;
    this.tokenInMaxAmount = tokenInMaxAmount;
  }

  static decode(reader: Reader, length: i32): MsgJoinSwapShareAmountOut {
    const end: usize = length < 0 ? reader.end : reader.ptr + length;
    const message = new MsgJoinSwapShareAmountOut();

    while (reader.ptr < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.sender = reader.string();
          break;

        case 2:
          message.poolId = BigInt.fromI32(reader.uint32());
          break;

        case 3:
          message.tokenInDenom = reader.string();
          break;

        case 4:
          message.shareOutAmount = BigInt.fromString(reader.string());
          break;

        case 5:
          message.tokenInMaxAmount = BigInt.fromString(reader.string());
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  }
}

export class MsgExitPool {
  sender: string;
  poolId: BigInt;
  shareInAmount: BigInt;
  tokenOutMins: Array<MsgToken>;

  constructor(
    sender: string = "",
    poolId: BigInt = constants.BIGINT_ZERO,
    shareInAmount: BigInt = constants.BIGINT_ZERO,
    tokenOutMins: Array<MsgToken> = []
  ) {
    this.sender = sender;
    this.poolId = poolId;
    this.shareInAmount = shareInAmount;
    this.tokenOutMins = tokenOutMins;
  }

  static decode(reader: Reader, length: i32): MsgExitPool {
    const end: usize = length < 0 ? reader.end : reader.ptr + length;
    const message = new MsgExitPool();

    while (reader.ptr < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.sender = reader.string();
          break;

        case 2:
          message.poolId = BigInt.fromI32(reader.uint32());
          break;

        case 3:
          message.shareInAmount = BigInt.fromString(reader.string());
          break;

        case 4:
          message.tokenOutMins.push(MsgToken.decode(reader, reader.uint32()));
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  }
}

export class MsgExitSwapExternAmountOut {
  sender: string;
  poolId: BigInt;
  tokenOut: MsgToken | null;
  shareInMaxAmount: BigInt;

  constructor(
    sender: string = "",
    poolId: BigInt = constants.BIGINT_ZERO,
    tokenOut: MsgToken | null = null,
    shareInMaxAmount: BigInt = constants.BIGINT_ZERO
  ) {
    this.sender = sender;
    this.poolId = poolId;
    this.tokenOut = tokenOut;
    this.shareInMaxAmount = shareInMaxAmount;
  }

  static decode(reader: Reader, length: i32): MsgExitSwapExternAmountOut {
    const end: usize = length < 0 ? reader.end : reader.ptr + length;
    const message = new MsgExitSwapExternAmountOut();

    while (reader.ptr < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.sender = reader.string();
          break;

        case 2:
          message.poolId = BigInt.fromI32(reader.uint32());
          break;

        case 3:
          message.tokenOut = MsgToken.decode(reader, reader.uint32());
          break;

        case 4:
          message.shareInMaxAmount = BigInt.fromString(reader.string());
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  }
}

export class MsgExitSwapShareAmountIn {
  sender: string;
  poolId: BigInt;
  tokenOutDenom: string;
  shareInAmount: BigInt;
  tokenOutMinAmount: BigInt;

  constructor(
    sender: string = "",
    poolId: BigInt = constants.BIGINT_ZERO,
    tokenOutDenom: string = "",
    shareInAmount: BigInt = constants.BIGINT_ZERO,
    tokenOutMinAmount: BigInt = constants.BIGINT_ZERO
  ) {
    this.sender = sender;
    this.poolId = poolId;
    this.tokenOutDenom = tokenOutDenom;
    this.shareInAmount = shareInAmount;
    this.tokenOutMinAmount = tokenOutMinAmount;
  }

  static decode(reader: Reader, length: i32): MsgExitSwapShareAmountIn {
    const end: usize = length < 0 ? reader.end : reader.ptr + length;
    const message = new MsgExitSwapShareAmountIn();

    while (reader.ptr < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.sender = reader.string();
          break;

        case 2:
          message.poolId = BigInt.fromI32(reader.uint32());
          break;

        case 3:
          message.tokenOutDenom = reader.string();
          break;

        case 4:
          message.shareInAmount = BigInt.fromString(reader.string());
          break;

        case 5:
          message.tokenOutMinAmount = BigInt.fromString(reader.string());
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  }
}
