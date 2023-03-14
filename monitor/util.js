export const monitorVersion = "v1.3.2";

export const sleep = m => new Promise(r => setTimeout(r, m));

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
    0x32CD32,
    0xff0000,
    0x0000FF,
    0xFFFF00,
    0x800080,
    0xFFA500,
    0xFFFFFF,
    0x964B00,
    0xADD8E6,
    0x006400,
    0x30D5C8,
    0xFF6700,
    0xCBC3E3,
    0x953553,
];