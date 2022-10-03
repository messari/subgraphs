import {json} from "@graphprotocol/graph-ts"

export const MAINNET_METADATA = json
  .fromString(
    `
{
  "0xf74ea34ac88862b7ff419e60e476be2651433e68": {
    "name": "Divibank",
    "v1StyleDeal": true
  },
  "0xaa2ccc5547f64c5dffd0a624eb4af2543a67ba65": {
    "name": "Tugende",
    "v1StyleDeal": true
  },
  "0xd798d527f770ad920bb50680dbc202bb0a1dafd6": {
    "name": "QuickCheck #1",
    "v1StyleDeal": true,
    "createdAt": 1629938152
  },
  "0x2107ade0e536b8b0b85cca5e0c0c3f66e58c053c": {
    "name": "QuickCheck #2",
    "v1StyleDeal": true,
    "createdAt": 1629937215
  },
  "0x1cc90f7bb292dab6fa4398f3763681cfe497db97": {
    "name": "QuickCheck #3",
    "v1StyleDeal": true,
    "createdAt": 1629937215
  },
  "0x3634855ec1beaf6f9be0f7d2f67fc9cb5f4eeea4": {
    "name": "Aspire #1",
    "v1StyleDeal": true,
    "createdAt": 1629937215
  },
  "0x9e8b9182abba7b4c188c979bc8f4c79f7f4c90d3": {
    "name": "Aspire #2",
    "v1StyleDeal": true,
    "createdAt": 1629938152
  },
  "0x8bbd80f88e662e56b918c353da635e210ece93c6": {
    "name": "Aspire #3",
    "v1StyleDeal": true,
    "createdAt": 1629934421
  },
  "0x1e73b5c1a3570b362d46ae9bf429b25c05e514a7": {
    "name": "PayJoy",
    "v1StyleDeal": true,
    "createdAt": 1629934421
  },
  "0x67df471eacd82c3dbc95604618ff2a1f6b14b8a1": {
    "name": "Almavest Basket #1",
    "v1StyleDeal": true,
    "createdAt": 1629937215
  },
  "0xe32c22e4d95cae1fb805c60c9e0026ed57971bcf": {
    "name": "Almavest Basket #2",
    "v1StyleDeal": true,
    "createdAt": 1630024822
  },
  "0xc13465ce9ae3aa184eb536f04fdc3f54d2def277": {
    "name": "Oya, via Almavest",
    "v1StyleDeal": true,
    "createdAt": 1630632626
  }
}
`
  )
  .toObject()
