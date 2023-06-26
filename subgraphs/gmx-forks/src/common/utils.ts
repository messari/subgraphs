import {
  log,
  BigInt,
  Bytes,
  Address,
  ethereum,
  BigDecimal,
} from "@graphprotocol/graph-ts";
import * as constants from "./constants";
import { Vault } from "../../generated/Vault/Vault";
import { Pool } from "../sdk/protocols/perpfutures/pool";
import { Token as TokenSchema } from "../../generated/schema";

export function enumToPrefix(snake: string): string {
  return snake.toLowerCase().replace("_", "-") + "-";
}

export function readValue<T>(
  callResult: ethereum.CallResult<T>,
  defaultValue: T
): T {
  if (callResult.reverted)
    log.warning("[readValue] Contract call reverted", []);
  return callResult.reverted ? defaultValue : callResult.value;
}

export function multiArraySort(
  ref: Array<Bytes>,
  arr1: Array<BigInt>,
  arr2: Array<BigDecimal>
): void {
  if (ref.length != arr1.length || ref.length != arr2.length) {
    // cannot sort
    return;
  }

  const sorter: Array<Array<string>> = [];
  for (let i = 0; i < ref.length; i++) {
    sorter[i] = [ref[i].toHexString(), arr1[i].toString(), arr2[i].toString()];
  }

  sorter.sort(function (a: Array<string>, b: Array<string>): i32 {
    if (a[0] < b[0]) {
      return -1;
    }
    return 1;
  });

  for (let i = 0; i < sorter.length; i++) {
    ref[i] = Bytes.fromHexString(sorter[i][0]);
    arr1[i] = BigInt.fromString(sorter[i][1]);
    arr2[i] = BigDecimal.fromString(sorter[i][2]);
  }
}

export function poolArraySort(
  ref: Array<Bytes>,
  arr1: Array<BigInt>,
  arr2: Array<BigDecimal>,
  arr3: Array<BigInt>,
  arr4: Array<BigDecimal>,
  arr5: Array<BigInt>,
  arr6: Array<BigDecimal>,
  arr7: Array<BigInt>,
  arr8: Array<BigDecimal>,
  arr9: Array<BigInt>,
  arr10: Array<BigDecimal>
): void {
  if (
    ref.length != arr1.length ||
    ref.length != arr2.length ||
    ref.length != arr3.length ||
    ref.length != arr4.length ||
    ref.length != arr5.length ||
    ref.length != arr6.length ||
    ref.length != arr7.length ||
    ref.length != arr8.length ||
    ref.length != arr9.length ||
    ref.length != arr10.length
  ) {
    // cannot sort
    return;
  }

  const sorter: Array<Array<string>> = [];
  for (let i = 0; i < ref.length; i++) {
    sorter[i] = [
      ref[i].toHexString(),
      arr1[i].toString(),
      arr2[i].toString(),
      arr3[i].toString(),
      arr4[i].toString(),
      arr5[i].toString(),
      arr6[i].toString(),
      arr7[i].toString(),
      arr8[i].toString(),
      arr9[i].toString(),
      arr10[i].toString(),
    ];
  }

  sorter.sort(function (a: Array<string>, b: Array<string>): i32 {
    if (a[0] < b[0]) {
      return -1;
    }
    return 1;
  });

  for (let i = 0; i < sorter.length; i++) {
    ref[i] = Bytes.fromHexString(sorter[i][0]);
    arr1[i] = BigInt.fromString(sorter[i][1]);
    arr2[i] = BigDecimal.fromString(sorter[i][2]);
    arr3[i] = BigInt.fromString(sorter[i][3]);
    arr4[i] = BigDecimal.fromString(sorter[i][4]);
    arr5[i] = BigInt.fromString(sorter[i][5]);
    arr6[i] = BigDecimal.fromString(sorter[i][6]);
    arr7[i] = BigInt.fromString(sorter[i][7]);
    arr8[i] = BigDecimal.fromString(sorter[i][8]);
    arr9[i] = BigInt.fromString(sorter[i][9]);
    arr10[i] = BigDecimal.fromString(sorter[i][10]);
  }
}

export function bigIntToBigDecimal(
  bigInt: BigInt,
  decimals: number
): BigDecimal {
  return bigInt.divDecimal(
    constants.BIGINT_TEN.pow(decimals as u8).toBigDecimal()
  );
}

export function getInputTokenBalancesFromContract(
  inputTokens: TokenSchema[]
): BigInt[] {
  const vaultContract = Vault.bind(constants.VAULT_ADDRESS);
  const inputTokenBalances = [];
  for (let i = 0; i < inputTokens.length; i++) {
    const inputTokenBalance = readValue(
      vaultContract.try_tokenBalances(Address.fromBytes(inputTokens[i].id)),
      constants.BIGINT_ZERO
    );
    inputTokenBalances.push(inputTokenBalance);
  }
  return inputTokenBalances;
}

export function checkAndUpdateInputTokens(
  pool: Pool,
  token: TokenSchema,
  newTokenBalance: BigInt = constants.BIGINT_ZERO
): void {
  if (pool.tokenExists(token)) return;
  pool.addInputToken(token, newTokenBalance);
}
