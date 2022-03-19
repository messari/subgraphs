import { Address, Bytes, BigInt, BigDecimal } from "@graphprotocol/graph-ts";

// @ts-ignore
//  function to convert the defined decimals into Graph's BigDecimal format
export function exponentToBigDecimal(decimals: i32): BigDecimal {
  let bd = BigDecimal.fromString("1");
  let bd10 = BigDecimal.fromString("10");
  for (let i = 0; i < decimals; i++) {
    bd = bd.times(bd10);
  }
  return bd;
}

// @ts-ignore
//  function to convert the BigInt number into real time values post dividing with the defined decimals
export function convertBINumToDesiredDecimals(value: BigInt, decimals: i32): BigDecimal {
  return value.toBigDecimal().div(exponentToBigDecimal(decimals));
}

//  function to convert the string to lower case
export function convertToLowerCase(str: string): string {
  // create a result variable
  let result = "";

  for (let i = 0; i < str.length; i++) {
    // get the code of the current character
    let code = str.charCodeAt(i);

    // check if it's within the range of capital letters
    if (code > 64 && code < 91) {
      // if so, add a new character to the result string
      // of the character from our code, plus 32
      result += String.fromCharCode(code + 32);
    } else {
      // otherwise, just add the current character
      result += str.charAt(i);
    }
  }

  return result;
}

//  Function to convert the string address to `Address` DataType
export function toAddress(str: string): Address {
  return Address.fromString(str);
}

//  Function to convert the string address to `Bytes` DataType
export function toBytes(str: string): Bytes {
  return <Bytes>Bytes.fromHexString(str);
}

//  Function to convert a `Bytes` address to `Address` DataType
export function convertBytesToAddress(address: Bytes): Address {
  return Address.fromString(address.toHexString());
}
