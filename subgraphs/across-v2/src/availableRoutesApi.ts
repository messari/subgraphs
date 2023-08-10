const availableRoutes: Array<Route> = [
  {
    originChainId: 1,
    originToken: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
    destinationChainId: 10,
    destinationToken: "0x4200000000000000000000000000000000000006",
  },
  {
    originChainId: 1,
    originToken: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
    destinationChainId: 10,
    destinationToken: "0x4200000000000000000000000000000000000006",
  },
  {
    originChainId: 1,
    originToken: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    destinationChainId: 10,
    destinationToken: "0x7f5c764cbc14f9669b88837ca1490cca17c31607",
  },
  {
    originChainId: 1,
    originToken: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
    destinationChainId: 10,
    destinationToken: "0x68f180fcce6836688e9084f035309e29bf0a2095",
  },
  {
    originChainId: 1,
    originToken: "0x04fa0d235c4abf4bcf4787af4cf447de572ef828",
    destinationChainId: 10,
    destinationToken: "0xe7798f023fc62146e8aa1b36da45fb70855a77ea",
  },
  {
    originChainId: 1,
    originToken: "0x6b175474e89094c44da98b954eedeac495271d0f",
    destinationChainId: 10,
    destinationToken: "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1",
  },
  {
    originChainId: 1,
    originToken: "0xba100000625a3754423978a60c9317c58a424e3d",
    destinationChainId: 10,
    destinationToken: "0xfe8b128ba8c78aabc59d4c64cee7ff28e9379921",
  },
  {
    originChainId: 1,
    originToken: "0x44108f0223a3c3028f5fe7aec7f9bb2e66bef82f",
    destinationChainId: 10,
    destinationToken: "0xff733b2a3557a7ed6697007ab5d11b79fdd1b76b",
  },
  {
    originChainId: 1,
    originToken: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
    destinationChainId: 137,
    destinationToken: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
  },
  {
    originChainId: 1,
    originToken: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
    destinationChainId: 137,
    destinationToken: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
  },
  {
    originChainId: 1,
    originToken: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    destinationChainId: 137,
    destinationToken: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
  },
  {
    originChainId: 1,
    originToken: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
    destinationChainId: 137,
    destinationToken: "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6",
  },
  {
    originChainId: 1,
    originToken: "0x04fa0d235c4abf4bcf4787af4cf447de572ef828",
    destinationChainId: 137,
    destinationToken: "0x3066818837c5e6ed6601bd5a91b0762877a6b731",
  },
  {
    originChainId: 1,
    originToken: "0x6b175474e89094c44da98b954eedeac495271d0f",
    destinationChainId: 137,
    destinationToken: "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063",
  },
  {
    originChainId: 1,
    originToken: "0xba100000625a3754423978a60c9317c58a424e3d",
    destinationChainId: 137,
    destinationToken: "0x9a71012b13ca4d3d0cdc72a177df3ef03b0e76a3",
  },
  {
    originChainId: 1,
    originToken: "0x44108f0223a3c3028f5fe7aec7f9bb2e66bef82f",
    destinationChainId: 137,
    destinationToken: "0xf328b73b6c685831f238c30a23fc19140cb4d8fc",
  },
  {
    originChainId: 1,
    originToken: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
    destinationChainId: 288,
    destinationToken: "0xdeaddeaddeaddeaddeaddeaddeaddeaddead0000",
  },
  {
    originChainId: 1,
    originToken: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
    destinationChainId: 288,
    destinationToken: "0xdeaddeaddeaddeaddeaddeaddeaddeaddead0000",
  },
  {
    originChainId: 1,
    originToken: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    destinationChainId: 288,
    destinationToken: "0x66a2a913e447d6b4bf33efbec43aaef87890fbbc",
  },
  {
    originChainId: 1,
    originToken: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
    destinationChainId: 288,
    destinationToken: "0xdc0486f8bf31df57a952bcd3c1d3e166e3d9ec8b",
  },
  {
    originChainId: 1,
    originToken: "0x04fa0d235c4abf4bcf4787af4cf447de572ef828",
    destinationChainId: 288,
    destinationToken: "0x780f33ad21314d9a1ffb6867fe53d48a76ec0d16",
  },
  {
    originChainId: 1,
    originToken: "0x6b175474e89094c44da98b954eedeac495271d0f",
    destinationChainId: 288,
    destinationToken: "0xf74195bb8a5cf652411867c5c2c5b8c2a402be35",
  },
  {
    originChainId: 1,
    originToken: "0x42bbfa2e77757c645eeaad1655e0911a7553efbc",
    destinationChainId: 288,
    destinationToken: "0xa18bf3994c0cc6e3b63ac420308e5383f53120d7",
  },
  {
    originChainId: 1,
    originToken: "0x44108f0223a3c3028f5fe7aec7f9bb2e66bef82f",
    destinationChainId: 288,
    destinationToken: "0x96821b258955587069f680729cd77369c0892b40",
  },
  {
    originChainId: 1,
    originToken: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
    destinationChainId: 42161,
    destinationToken: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
  },
  {
    originChainId: 1,
    originToken: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
    destinationChainId: 42161,
    destinationToken: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
  },
  {
    originChainId: 1,
    originToken: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    destinationChainId: 42161,
    destinationToken: "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8",
  },
  {
    originChainId: 1,
    originToken: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
    destinationChainId: 42161,
    destinationToken: "0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f",
  },
  {
    originChainId: 1,
    originToken: "0x04fa0d235c4abf4bcf4787af4cf447de572ef828",
    destinationChainId: 42161,
    destinationToken: "0xd693ec944a85eeca4247ec1c3b130dca9b0c3b22",
  },
  {
    originChainId: 1,
    originToken: "0x6b175474e89094c44da98b954eedeac495271d0f",
    destinationChainId: 42161,
    destinationToken: "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1",
  },
  {
    originChainId: 1,
    originToken: "0xba100000625a3754423978a60c9317c58a424e3d",
    destinationChainId: 42161,
    destinationToken: "0x040d1edc9569d4bab2d15287dc5a4f10f56a56b8",
  },
  {
    originChainId: 1,
    originToken: "0x44108f0223a3c3028f5fe7aec7f9bb2e66bef82f",
    destinationChainId: 42161,
    destinationToken: "0x53691596d1bce8cea565b84d4915e69e03d9c99d",
  },
  {
    originChainId: 10,
    originToken: "0x4200000000000000000000000000000000000006",
    destinationChainId: 1,
    destinationToken: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
  },
  {
    originChainId: 10,
    originToken: "0x4200000000000000000000000000000000000006",
    destinationChainId: 1,
    destinationToken: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
  },
  {
    originChainId: 10,
    originToken: "0x7f5c764cbc14f9669b88837ca1490cca17c31607",
    destinationChainId: 1,
    destinationToken: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  },
  {
    originChainId: 10,
    originToken: "0x68f180fcce6836688e9084f035309e29bf0a2095",
    destinationChainId: 1,
    destinationToken: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
  },
  {
    originChainId: 10,
    originToken: "0xe7798f023fc62146e8aa1b36da45fb70855a77ea",
    destinationChainId: 1,
    destinationToken: "0x04fa0d235c4abf4bcf4787af4cf447de572ef828",
  },
  {
    originChainId: 10,
    originToken: "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1",
    destinationChainId: 1,
    destinationToken: "0x6b175474e89094c44da98b954eedeac495271d0f",
  },
  {
    originChainId: 10,
    originToken: "0xfe8b128ba8c78aabc59d4c64cee7ff28e9379921",
    destinationChainId: 1,
    destinationToken: "0xba100000625a3754423978a60c9317c58a424e3d",
  },
  {
    originChainId: 10,
    originToken: "0xff733b2a3557a7ed6697007ab5d11b79fdd1b76b",
    destinationChainId: 1,
    destinationToken: "0x44108f0223a3c3028f5fe7aec7f9bb2e66bef82f",
  },
  {
    originChainId: 10,
    originToken: "0x4200000000000000000000000000000000000006",
    destinationChainId: 137,
    destinationToken: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
  },
  {
    originChainId: 10,
    originToken: "0x4200000000000000000000000000000000000006",
    destinationChainId: 137,
    destinationToken: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
  },
  {
    originChainId: 10,
    originToken: "0x7f5c764cbc14f9669b88837ca1490cca17c31607",
    destinationChainId: 137,
    destinationToken: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
  },
  {
    originChainId: 10,
    originToken: "0x68f180fcce6836688e9084f035309e29bf0a2095",
    destinationChainId: 137,
    destinationToken: "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6",
  },
  {
    originChainId: 10,
    originToken: "0xe7798f023fc62146e8aa1b36da45fb70855a77ea",
    destinationChainId: 137,
    destinationToken: "0x3066818837c5e6ed6601bd5a91b0762877a6b731",
  },
  {
    originChainId: 10,
    originToken: "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1",
    destinationChainId: 137,
    destinationToken: "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063",
  },
  {
    originChainId: 10,
    originToken: "0xfe8b128ba8c78aabc59d4c64cee7ff28e9379921",
    destinationChainId: 137,
    destinationToken: "0x9a71012b13ca4d3d0cdc72a177df3ef03b0e76a3",
  },
  {
    originChainId: 10,
    originToken: "0xff733b2a3557a7ed6697007ab5d11b79fdd1b76b",
    destinationChainId: 137,
    destinationToken: "0xf328b73b6c685831f238c30a23fc19140cb4d8fc",
  },
  {
    originChainId: 10,
    originToken: "0x4200000000000000000000000000000000000006",
    destinationChainId: 288,
    destinationToken: "0xdeaddeaddeaddeaddeaddeaddeaddeaddead0000",
  },
  {
    originChainId: 10,
    originToken: "0x4200000000000000000000000000000000000006",
    destinationChainId: 288,
    destinationToken: "0xdeaddeaddeaddeaddeaddeaddeaddeaddead0000",
  },
  {
    originChainId: 10,
    originToken: "0x7f5c764cbc14f9669b88837ca1490cca17c31607",
    destinationChainId: 288,
    destinationToken: "0x66a2a913e447d6b4bf33efbec43aaef87890fbbc",
  },
  {
    originChainId: 10,
    originToken: "0x68f180fcce6836688e9084f035309e29bf0a2095",
    destinationChainId: 288,
    destinationToken: "0xdc0486f8bf31df57a952bcd3c1d3e166e3d9ec8b",
  },
  {
    originChainId: 10,
    originToken: "0xe7798f023fc62146e8aa1b36da45fb70855a77ea",
    destinationChainId: 288,
    destinationToken: "0x780f33ad21314d9a1ffb6867fe53d48a76ec0d16",
  },
  {
    originChainId: 10,
    originToken: "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1",
    destinationChainId: 288,
    destinationToken: "0xf74195bb8a5cf652411867c5c2c5b8c2a402be35",
  },
  {
    originChainId: 10,
    originToken: "0xff733b2a3557a7ed6697007ab5d11b79fdd1b76b",
    destinationChainId: 288,
    destinationToken: "0x96821b258955587069f680729cd77369c0892b40",
  },
  {
    originChainId: 10,
    originToken: "0x4200000000000000000000000000000000000006",
    destinationChainId: 42161,
    destinationToken: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
  },
  {
    originChainId: 10,
    originToken: "0x4200000000000000000000000000000000000006",
    destinationChainId: 42161,
    destinationToken: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
  },
  {
    originChainId: 10,
    originToken: "0x7f5c764cbc14f9669b88837ca1490cca17c31607",
    destinationChainId: 42161,
    destinationToken: "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8",
  },
  {
    originChainId: 10,
    originToken: "0x68f180fcce6836688e9084f035309e29bf0a2095",
    destinationChainId: 42161,
    destinationToken: "0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f",
  },
  {
    originChainId: 10,
    originToken: "0xe7798f023fc62146e8aa1b36da45fb70855a77ea",
    destinationChainId: 42161,
    destinationToken: "0xd693ec944a85eeca4247ec1c3b130dca9b0c3b22",
  },
  {
    originChainId: 10,
    originToken: "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1",
    destinationChainId: 42161,
    destinationToken: "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1",
  },
  {
    originChainId: 10,
    originToken: "0xfe8b128ba8c78aabc59d4c64cee7ff28e9379921",
    destinationChainId: 42161,
    destinationToken: "0x040d1edc9569d4bab2d15287dc5a4f10f56a56b8",
  },
  {
    originChainId: 10,
    originToken: "0xff733b2a3557a7ed6697007ab5d11b79fdd1b76b",
    destinationChainId: 42161,
    destinationToken: "0x53691596d1bce8cea565b84d4915e69e03d9c99d",
  },
  {
    originChainId: 137,
    originToken: "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063",
    destinationChainId: 1,
    destinationToken: "0x6b175474e89094c44da98b954eedeac495271d0f",
  },
  {
    originChainId: 137,
    originToken: "0x3066818837c5e6ed6601bd5a91b0762877a6b731",
    destinationChainId: 1,
    destinationToken: "0x04fa0d235c4abf4bcf4787af4cf447de572ef828",
  },
  {
    originChainId: 137,
    originToken: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
    destinationChainId: 1,
    destinationToken: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
  },
  {
    originChainId: 137,
    originToken: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
    destinationChainId: 1,
    destinationToken: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  },
  {
    originChainId: 137,
    originToken: "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6",
    destinationChainId: 1,
    destinationToken: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
  },
  {
    originChainId: 137,
    originToken: "0x9a71012b13ca4d3d0cdc72a177df3ef03b0e76a3",
    destinationChainId: 1,
    destinationToken: "0xba100000625a3754423978a60c9317c58a424e3d",
  },
  {
    originChainId: 137,
    originToken: "0xf328b73b6c685831f238c30a23fc19140cb4d8fc",
    destinationChainId: 1,
    destinationToken: "0x44108f0223a3c3028f5fe7aec7f9bb2e66bef82f",
  },
  {
    originChainId: 137,
    originToken: "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063",
    destinationChainId: 10,
    destinationToken: "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1",
  },
  {
    originChainId: 137,
    originToken: "0x3066818837c5e6ed6601bd5a91b0762877a6b731",
    destinationChainId: 10,
    destinationToken: "0xe7798f023fc62146e8aa1b36da45fb70855a77ea",
  },
  {
    originChainId: 137,
    originToken: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
    destinationChainId: 10,
    destinationToken: "0x4200000000000000000000000000000000000006",
  },
  {
    originChainId: 137,
    originToken: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
    destinationChainId: 10,
    destinationToken: "0x7f5c764cbc14f9669b88837ca1490cca17c31607",
  },
  {
    originChainId: 137,
    originToken: "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6",
    destinationChainId: 10,
    destinationToken: "0x68f180fcce6836688e9084f035309e29bf0a2095",
  },
  {
    originChainId: 137,
    originToken: "0x9a71012b13ca4d3d0cdc72a177df3ef03b0e76a3",
    destinationChainId: 10,
    destinationToken: "0xfe8b128ba8c78aabc59d4c64cee7ff28e9379921",
  },
  {
    originChainId: 137,
    originToken: "0xf328b73b6c685831f238c30a23fc19140cb4d8fc",
    destinationChainId: 10,
    destinationToken: "0xff733b2a3557a7ed6697007ab5d11b79fdd1b76b",
  },
  {
    originChainId: 137,
    originToken: "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063",
    destinationChainId: 288,
    destinationToken: "0xf74195bb8a5cf652411867c5c2c5b8c2a402be35",
  },
  {
    originChainId: 137,
    originToken: "0x3066818837c5e6ed6601bd5a91b0762877a6b731",
    destinationChainId: 288,
    destinationToken: "0x780f33ad21314d9a1ffb6867fe53d48a76ec0d16",
  },
  {
    originChainId: 137,
    originToken: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
    destinationChainId: 288,
    destinationToken: "0xdeaddeaddeaddeaddeaddeaddeaddeaddead0000",
  },
  {
    originChainId: 137,
    originToken: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
    destinationChainId: 288,
    destinationToken: "0x66a2a913e447d6b4bf33efbec43aaef87890fbbc",
  },
  {
    originChainId: 137,
    originToken: "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6",
    destinationChainId: 288,
    destinationToken: "0xdc0486f8bf31df57a952bcd3c1d3e166e3d9ec8b",
  },
  {
    originChainId: 137,
    originToken: "0xf328b73b6c685831f238c30a23fc19140cb4d8fc",
    destinationChainId: 288,
    destinationToken: "0x96821b258955587069f680729cd77369c0892b40",
  },
  {
    originChainId: 137,
    originToken: "0x3066818837c5e6ed6601bd5a91b0762877a6b731",
    destinationChainId: 42161,
    destinationToken: "0xd693ec944a85eeca4247ec1c3b130dca9b0c3b22",
  },
  {
    originChainId: 137,
    originToken: "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063",
    destinationChainId: 42161,
    destinationToken: "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1",
  },
  {
    originChainId: 137,
    originToken: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
    destinationChainId: 42161,
    destinationToken: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
  },
  {
    originChainId: 137,
    originToken: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
    destinationChainId: 42161,
    destinationToken: "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8",
  },
  {
    originChainId: 137,
    originToken: "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6",
    destinationChainId: 42161,
    destinationToken: "0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f",
  },
  {
    originChainId: 137,
    originToken: "0x9a71012b13ca4d3d0cdc72a177df3ef03b0e76a3",
    destinationChainId: 42161,
    destinationToken: "0x040d1edc9569d4bab2d15287dc5a4f10f56a56b8",
  },
  {
    originChainId: 137,
    originToken: "0xf328b73b6c685831f238c30a23fc19140cb4d8fc",
    destinationChainId: 42161,
    destinationToken: "0x53691596d1bce8cea565b84d4915e69e03d9c99d",
  },
  {
    originChainId: 288,
    originToken: "0xdeaddeaddeaddeaddeaddeaddeaddeaddead0000",
    destinationChainId: 1,
    destinationToken: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
  },
  {
    originChainId: 288,
    originToken: "0xdeaddeaddeaddeaddeaddeaddeaddeaddead0000",
    destinationChainId: 1,
    destinationToken: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
  },
  {
    originChainId: 288,
    originToken: "0x66a2a913e447d6b4bf33efbec43aaef87890fbbc",
    destinationChainId: 1,
    destinationToken: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  },
  {
    originChainId: 288,
    originToken: "0xdc0486f8bf31df57a952bcd3c1d3e166e3d9ec8b",
    destinationChainId: 1,
    destinationToken: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
  },
  {
    originChainId: 288,
    originToken: "0x780f33ad21314d9a1ffb6867fe53d48a76ec0d16",
    destinationChainId: 1,
    destinationToken: "0x04fa0d235c4abf4bcf4787af4cf447de572ef828",
  },
  {
    originChainId: 288,
    originToken: "0xf74195bb8a5cf652411867c5c2c5b8c2a402be35",
    destinationChainId: 1,
    destinationToken: "0x6b175474e89094c44da98b954eedeac495271d0f",
  },
  {
    originChainId: 288,
    originToken: "0xa18bf3994c0cc6e3b63ac420308e5383f53120d7",
    destinationChainId: 1,
    destinationToken: "0x42bbfa2e77757c645eeaad1655e0911a7553efbc",
  },
  {
    originChainId: 288,
    originToken: "0x96821b258955587069f680729cd77369c0892b40",
    destinationChainId: 1,
    destinationToken: "0x44108f0223a3c3028f5fe7aec7f9bb2e66bef82f",
  },
  {
    originChainId: 288,
    originToken: "0xdeaddeaddeaddeaddeaddeaddeaddeaddead0000",
    destinationChainId: 10,
    destinationToken: "0x4200000000000000000000000000000000000006",
  },
  {
    originChainId: 288,
    originToken: "0xdeaddeaddeaddeaddeaddeaddeaddeaddead0000",
    destinationChainId: 10,
    destinationToken: "0x4200000000000000000000000000000000000006",
  },
  {
    originChainId: 288,
    originToken: "0x66a2a913e447d6b4bf33efbec43aaef87890fbbc",
    destinationChainId: 10,
    destinationToken: "0x7f5c764cbc14f9669b88837ca1490cca17c31607",
  },
  {
    originChainId: 288,
    originToken: "0xdc0486f8bf31df57a952bcd3c1d3e166e3d9ec8b",
    destinationChainId: 10,
    destinationToken: "0x68f180fcce6836688e9084f035309e29bf0a2095",
  },
  {
    originChainId: 288,
    originToken: "0x780f33ad21314d9a1ffb6867fe53d48a76ec0d16",
    destinationChainId: 10,
    destinationToken: "0xe7798f023fc62146e8aa1b36da45fb70855a77ea",
  },
  {
    originChainId: 288,
    originToken: "0xf74195bb8a5cf652411867c5c2c5b8c2a402be35",
    destinationChainId: 10,
    destinationToken: "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1",
  },
  {
    originChainId: 288,
    originToken: "0x96821b258955587069f680729cd77369c0892b40",
    destinationChainId: 10,
    destinationToken: "0xff733b2a3557a7ed6697007ab5d11b79fdd1b76b",
  },
  {
    originChainId: 288,
    originToken: "0xdeaddeaddeaddeaddeaddeaddeaddeaddead0000",
    destinationChainId: 137,
    destinationToken: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
  },
  {
    originChainId: 288,
    originToken: "0xdeaddeaddeaddeaddeaddeaddeaddeaddead0000",
    destinationChainId: 137,
    destinationToken: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
  },
  {
    originChainId: 288,
    originToken: "0x66a2a913e447d6b4bf33efbec43aaef87890fbbc",
    destinationChainId: 137,
    destinationToken: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
  },
  {
    originChainId: 288,
    originToken: "0xdc0486f8bf31df57a952bcd3c1d3e166e3d9ec8b",
    destinationChainId: 137,
    destinationToken: "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6",
  },
  {
    originChainId: 288,
    originToken: "0x780f33ad21314d9a1ffb6867fe53d48a76ec0d16",
    destinationChainId: 137,
    destinationToken: "0x3066818837c5e6ed6601bd5a91b0762877a6b731",
  },
  {
    originChainId: 288,
    originToken: "0xf74195bb8a5cf652411867c5c2c5b8c2a402be35",
    destinationChainId: 137,
    destinationToken: "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063",
  },
  {
    originChainId: 288,
    originToken: "0x96821b258955587069f680729cd77369c0892b40",
    destinationChainId: 137,
    destinationToken: "0xf328b73b6c685831f238c30a23fc19140cb4d8fc",
  },
  {
    originChainId: 288,
    originToken: "0xdeaddeaddeaddeaddeaddeaddeaddeaddead0000",
    destinationChainId: 42161,
    destinationToken: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
  },
  {
    originChainId: 288,
    originToken: "0xdeaddeaddeaddeaddeaddeaddeaddeaddead0000",
    destinationChainId: 42161,
    destinationToken: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
  },
  {
    originChainId: 288,
    originToken: "0x66a2a913e447d6b4bf33efbec43aaef87890fbbc",
    destinationChainId: 42161,
    destinationToken: "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8",
  },
  {
    originChainId: 288,
    originToken: "0xdc0486f8bf31df57a952bcd3c1d3e166e3d9ec8b",
    destinationChainId: 42161,
    destinationToken: "0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f",
  },
  {
    originChainId: 288,
    originToken: "0x780f33ad21314d9a1ffb6867fe53d48a76ec0d16",
    destinationChainId: 42161,
    destinationToken: "0xd693ec944a85eeca4247ec1c3b130dca9b0c3b22",
  },
  {
    originChainId: 288,
    originToken: "0xf74195bb8a5cf652411867c5c2c5b8c2a402be35",
    destinationChainId: 42161,
    destinationToken: "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1",
  },
  {
    originChainId: 288,
    originToken: "0x96821b258955587069f680729cd77369c0892b40",
    destinationChainId: 42161,
    destinationToken: "0x53691596d1bce8cea565b84d4915e69e03d9c99d",
  },
  {
    originChainId: 42161,
    originToken: "0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f",
    destinationChainId: 1,
    destinationToken: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
  },
  {
    originChainId: 42161,
    originToken: "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8",
    destinationChainId: 1,
    destinationToken: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  },
  {
    originChainId: 42161,
    originToken: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
    destinationChainId: 1,
    destinationToken: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
  },
  {
    originChainId: 42161,
    originToken: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
    destinationChainId: 1,
    destinationToken: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
  },
  {
    originChainId: 42161,
    originToken: "0xd693ec944a85eeca4247ec1c3b130dca9b0c3b22",
    destinationChainId: 1,
    destinationToken: "0x04fa0d235c4abf4bcf4787af4cf447de572ef828",
  },
  {
    originChainId: 42161,
    originToken: "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1",
    destinationChainId: 1,
    destinationToken: "0x6b175474e89094c44da98b954eedeac495271d0f",
  },
  {
    originChainId: 42161,
    originToken: "0x040d1edc9569d4bab2d15287dc5a4f10f56a56b8",
    destinationChainId: 1,
    destinationToken: "0xba100000625a3754423978a60c9317c58a424e3d",
  },
  {
    originChainId: 42161,
    originToken: "0x53691596d1bce8cea565b84d4915e69e03d9c99d",
    destinationChainId: 1,
    destinationToken: "0x44108f0223a3c3028f5fe7aec7f9bb2e66bef82f",
  },
  {
    originChainId: 42161,
    originToken: "0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f",
    destinationChainId: 10,
    destinationToken: "0x68f180fcce6836688e9084f035309e29bf0a2095",
  },
  {
    originChainId: 42161,
    originToken: "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8",
    destinationChainId: 10,
    destinationToken: "0x7f5c764cbc14f9669b88837ca1490cca17c31607",
  },
  {
    originChainId: 42161,
    originToken: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
    destinationChainId: 10,
    destinationToken: "0x4200000000000000000000000000000000000006",
  },
  {
    originChainId: 42161,
    originToken: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
    destinationChainId: 10,
    destinationToken: "0x4200000000000000000000000000000000000006",
  },
  {
    originChainId: 42161,
    originToken: "0xd693ec944a85eeca4247ec1c3b130dca9b0c3b22",
    destinationChainId: 10,
    destinationToken: "0xe7798f023fc62146e8aa1b36da45fb70855a77ea",
  },
  {
    originChainId: 42161,
    originToken: "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1",
    destinationChainId: 10,
    destinationToken: "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1",
  },
  {
    originChainId: 42161,
    originToken: "0x040d1edc9569d4bab2d15287dc5a4f10f56a56b8",
    destinationChainId: 10,
    destinationToken: "0xfe8b128ba8c78aabc59d4c64cee7ff28e9379921",
  },
  {
    originChainId: 42161,
    originToken: "0x53691596d1bce8cea565b84d4915e69e03d9c99d",
    destinationChainId: 10,
    destinationToken: "0xff733b2a3557a7ed6697007ab5d11b79fdd1b76b",
  },
  {
    originChainId: 42161,
    originToken: "0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f",
    destinationChainId: 137,
    destinationToken: "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6",
  },
  {
    originChainId: 42161,
    originToken: "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8",
    destinationChainId: 137,
    destinationToken: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
  },
  {
    originChainId: 42161,
    originToken: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
    destinationChainId: 137,
    destinationToken: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
  },
  {
    originChainId: 42161,
    originToken: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
    destinationChainId: 137,
    destinationToken: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
  },
  {
    originChainId: 42161,
    originToken: "0xd693ec944a85eeca4247ec1c3b130dca9b0c3b22",
    destinationChainId: 137,
    destinationToken: "0x3066818837c5e6ed6601bd5a91b0762877a6b731",
  },
  {
    originChainId: 42161,
    originToken: "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1",
    destinationChainId: 137,
    destinationToken: "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063",
  },
  {
    originChainId: 42161,
    originToken: "0x040d1edc9569d4bab2d15287dc5a4f10f56a56b8",
    destinationChainId: 137,
    destinationToken: "0x9a71012b13ca4d3d0cdc72a177df3ef03b0e76a3",
  },
  {
    originChainId: 42161,
    originToken: "0x53691596d1bce8cea565b84d4915e69e03d9c99d",
    destinationChainId: 137,
    destinationToken: "0xf328b73b6c685831f238c30a23fc19140cb4d8fc",
  },
  {
    originChainId: 42161,
    originToken: "0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f",
    destinationChainId: 288,
    destinationToken: "0xdc0486f8bf31df57a952bcd3c1d3e166e3d9ec8b",
  },
  {
    originChainId: 42161,
    originToken: "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8",
    destinationChainId: 288,
    destinationToken: "0x66a2a913e447d6b4bf33efbec43aaef87890fbbc",
  },
  {
    originChainId: 42161,
    originToken: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
    destinationChainId: 288,
    destinationToken: "0xdeaddeaddeaddeaddeaddeaddeaddeaddead0000",
  },
  {
    originChainId: 42161,
    originToken: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
    destinationChainId: 288,
    destinationToken: "0xdeaddeaddeaddeaddeaddeaddeaddeaddead0000",
  },
  {
    originChainId: 42161,
    originToken: "0xd693ec944a85eeca4247ec1c3b130dca9b0c3b22",
    destinationChainId: 288,
    destinationToken: "0x780f33ad21314d9a1ffb6867fe53d48a76ec0d16",
  },
  {
    originChainId: 42161,
    originToken: "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1",
    destinationChainId: 288,
    destinationToken: "0xf74195bb8a5cf652411867c5c2c5b8c2a402be35",
  },
  {
    originChainId: 42161,
    originToken: "0x53691596d1bce8cea565b84d4915e69e03d9c99d",
    destinationChainId: 288,
    destinationToken: "0x96821b258955587069f680729cd77369c0892b40",
  },
];

class Route {
  originChainId: i32;
  originToken: string;
  destinationChainId: i32;
  destinationToken: string;
}

export function findOriginToken(
  originChainId: i32,
  destinationChainId: i32,
  destinationToken: string
): string {
  for (let i = 0; i < availableRoutes.length; i++) {
    const route = availableRoutes[i];

    if (
      route.originChainId == originChainId &&
      route.destinationToken.toLowerCase() == destinationToken.toLowerCase() &&
      route.destinationChainId == destinationChainId
    ) {
      return route.originToken;
    }
  }

  return destinationToken;
}

export function findDestinationToken(
  originChainId: i32,
  destinationChainId: i32,
  originToken: string
): string {
  for (let i = 0; i < availableRoutes.length; i++) {
    const route = availableRoutes[i];

    if (
      route.originChainId == originChainId &&
      route.originToken.toLowerCase() == originToken.toLowerCase() &&
      route.destinationChainId == destinationChainId
    ) {
      return route.destinationToken;
    }
  }

  return originToken;
}
