# Friend Tech Protocol Subgraph Metrics Methodology v1.0.0

friend-tech subgraph based on a non-standard schema - (derived from generic schema v2.1.1).

## Business Summary

- Friend.tech is a decentralized social network. Users can buy and sell `keys` (previously known as `shares`) that are linked to Twitter (now X) accounts. These keys offer access to private in-app chatrooms and exclusive content from that X user.
- Social tokens combine aspects of traditional cryptocurrencies with patronage systems, allowing influencers, creators, and others to monetize a fan base in exchange for exclusive offers and content.
- The price of keys is determined based on the concept of a bonding curve. The price follows a mathematical relationship to the supply of the keys within a given group. Therefore, the more shares purchased, the higher the chances of the prices increasing.
- Every key-related buy-sell transaction attracts a 10% fee — half of which goes to the creator, and the other half goes to the treasury.
- Every user is either a "subject" or a "trader" at Friend.tech.
  - Subjects (the creators) register on the platform by connecting their Twitter account, and enable people to speculate on their keys. They earn a fee on each trade.
  - Traders (the followers) buy / sell keys of subjects. Depending on how big the subject’s network grows, the key price appreciates, and traders can then sell it for a profit, or keep holding.

## Financial and Usage Metrics

> Note: `trade value = key value + subject fee + protocol fee`

Total Value Locked:

- TVL = ∑ (key value in Buy trades) - ∑ (key value in Sell trades)

Revenue:

- Total Revenue = 10% total fee on trade value
- Supply Side Revenue = 5% subject fee on trade value
- Protocol Side Revenue = 5% protocol fee on trade value

Volume:

- Buy Volume = ∑ (key value in Buy trades)
- Sell Volume = ∑ (key value in Sell trades)
- Total Volume = Buy Volume + Sell Volume
- Net Volume = Buy Volume - Sell Volume

Activity:

- There are two groups of users, `Traders` and `Subjects`
  - Traders can further be classified into `Buyers` and `Sellers`

## Links:

- Protocol: https://www.friend.tech/
- Main Contract: https://basescan.org/address/0xcf205808ed36593aa40a44f10c7f7c2f67d4a4d4
- Stats Dashboards:
  - https://dune.com/cryptokoryo/friendtech
  - https://dune.com/austin_adams/friendstech-dashboard
  - https://dune.com/hildobby/friendtech
