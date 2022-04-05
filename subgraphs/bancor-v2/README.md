# Bancor V2

## Contracts

ContractRegistry https://etherscan.io/address/0x52Ae12ABe5D8BD778BD5397F99cA900624CfADD4

BancorNetwork https://etherscan.io/address/0x2F9EC37d6CcFFf1caB21733BdaDEdE11c823cCB0

ConverterRegistry https://etherscan.io/address/0xC0205e203F423Bcd8B2a4d6f8C8A154b0Aa60F19
- Note, it should NOT be BancorConverterRegistry https://etherscan.io/address/0x3cc4A258AFF14a88380CA3d9703D6BBFb7a8042e
- Under `getAnchors` method of ConverterRegistry, there are both `SmartToken` and `DSToken` instances.
- Clicking into `owner` field of a `SmartToken` brings you to `BancorConverter`, such as https://etherscan.io/address/0x1e9653f8a3f1d5acec0d334e6433b9677acce7ff
- Clicking into `owner` field of a `DSToken` brings you to `StandardPoolConverter`, such as https://etherscan.io/address/0x13440ac936e432494770522eddf95e45646323c8

## Event Mappings

Token -> DSToken(name, symbol, decimals)

Pool response

```json
{
   "reserves":[
      {
         "dlt_id":"0x1F573D6Fb3F13d689FF844B4cE37794d79a7FF1C",
         "symbol":"BNT",
         "name":"Bancor Network Token",
         "balance":{
            "usd":"433.696830921121211301"
         },
         "weight":500000,
         "price":{
            "usd":"2.753190"
         },
         "price_24h_ago":{
            "usd":"2.708369"
         },
         "volume_24h":{
            "usd":"1158.443563",
            "base":"357.514480140216411986"
         }
      },
      {
         "dlt_id":"0xe0cCa86B254005889aC3a81e737f56a14f4A38F5",
         "symbol":"ALTA",
         "name":"Alta Finance",
         "balance":{
            "usd":"8513.454579924797285828"
         },
         "weight":500000,
         "price":{
            "usd":"0.140098"
         },
         "price_24h_ago":{
            "usd":"0.148258"
         },
         "volume_24h":{
            "usd":"1158.443563",
            "base":"4821.357133965780206163"
         }
      }
   ],
   "dlt_type":"ethereum",
   "dlt_id":"0x30c2F54BAEDC0D8D21C9d079C4e2d46cf5fd972C",
   "type":3,
   "version":46,
   "symbol":"ALTA",
   "name":"ALTA/BNT",
   "supply":"1674.136618659235043069",
   "converter_dlt_id":"0xFb952111379956076Dc15c60Cdc6987dcf98b049",
   "isWhitelisted":false,
   "conversion_fee":"0.2",
   "liquidity":{
      "usd":"2385.447933"
   },
   "volume_24h":{
      "usd":"1158.443563"
   },
   "fees_24h":{
      "usd":"2.321529"
   }
}
```

Add liquidity https://ropsten.etherscan.io/tx/0x431e5c6b21194cafdb58aee63138e46988f913823a759502642cf98682bd6dc7#eventlog

Remove liquidity https://ropsten.etherscan.io/tx/0x7ad83969dfe839c0f9ff67574c900aa1bff1308957b8d3b765b2b61d7231d888#eventlog

Swap https://ropsten.etherscan.io/tx/0xbcff3cba12eede1f912ce5ba5908a9cb2e2a139ef2c10aa1c156f64203a6e923#eventlog

Deployed at https://thegraph.com/studio/subgraph/bancor-v2/