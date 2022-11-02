export const monitorVersion = "v1.1.6";

export const sleep = (m) => new Promise((r) => setTimeout(r, m));

export const ProtocolTypeEntityName = {
  exchange: "dexAmmProtocol",
  exchanges: "dexAmmProtocol",
  "dex-amm": "dexAmmProtocol",
  lending: "lendingProtocol",
  yield: "yieldAggregator",
  yields: "yieldAggregator",
  vault: "yieldAggregator",
  vaults: "yieldAggregator",
  "yield-aggregator": "yieldAggregator",
  generic: "protocol",
};

export const formatIntToFixed2 = (val) => {
  let returnStr = parseFloat(val.toFixed(2)).toLocaleString();
  if (returnStr.split(".")[1]?.length === 1) {
    returnStr += "0";
  } else if (!returnStr.split(".")[1]?.length) {
    returnStr += ".00";
  }
  return returnStr;
};

export const colorsArray = [
  0x32cd32, 0xff0000, 0x0000ff, 0xffff00, 0x800080, 0xffa500, 0xffffff,
  0x964b00, 0xadd8e6, 0x006400, 0x30d5c8, 0xff6700, 0xcbc3e3, 0x953553,
];
