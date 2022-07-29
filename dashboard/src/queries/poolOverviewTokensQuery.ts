import { ProtocolType } from "../constants";

export const poolOverviewTokensQuery = (protocolType: string): string => {
    // The version group uses the first two digits  of the schema version and defaults to that schema.
    if (protocolType === ProtocolType.EXCHANGE) {
        return fetchTokensOnExchange();
    } else if (protocolType === ProtocolType.LENDING) {
        return fetchTokensOnLending();
    } else if (protocolType === ProtocolType.YIELD) {
        return fetchTokensOnYield();
    } else {
        return fetchTokensOnGeneric();
    }
};


const fetchTokensOnExchange = (): string => {

    return `
      query Data($pool1Id: String!, $pool2Id: String!,$pool3Id: String!,$pool4Id: String!,$pool5Id: String!,$pool6Id: String!,$pool7Id: String!,$pool8Id: String!,$pool9Id: String!,$pool10Id: String!) {
        pool1: liquidityPool(id: $pool1Id) {
          id
          inputTokens{
            name
            symbol
          }
          rewardTokens {
            id
            type
            token {
              decimals
              name
              symbol
            }
          }
        }
        pool2: liquidityPool(id: $pool2Id) {
            id
            inputTokens{
              name
              symbol
            }
            rewardTokens {
              id
              type
              token {
                decimals
                name
                symbol
              }
            }
          }
        pool3: liquidityPool(id: $pool3Id) {
            id
            inputTokens{
              name
              symbol
            }
            rewardTokens {
              id
              type
              token {
                decimals
                name
                symbol
              }
            }
          }
        pool4: liquidityPool(id: $pool4Id) {
            id
            inputTokens{
              name
              symbol
            }
            rewardTokens {
              id
              type
              token {
                decimals
                name
                symbol
              }
            }
          }
        pool5: liquidityPool(id: $pool5Id) {
            id
            inputTokens{
              name
              symbol
            }
            rewardTokens {
              id
              type
              token {
                decimals
                name
                symbol
              }
            }
          }
        pool6: liquidityPool(id: $pool6Id) {
            id
            inputTokens{
              name
              symbol
            }
            rewardTokens {
              id
              type
              token {
                decimals
                name
                symbol
              }
            }
          }
        pool7: liquidityPool(id: $pool7Id) {
            id
            inputTokens{
              name
              symbol
            }
            rewardTokens {
              id
              type
              token {
                decimals
                name
                symbol
              }
            }
          }
        pool8: liquidityPool(id: $pool8Id) {
            id
            inputTokens{
              name
              symbol
            }
            rewardTokens {
              id
              type
              token {
                decimals
                name
                symbol
              }
            }
          }
        pool9: liquidityPool(id: $pool9Id) {
            id
            inputTokens{
              name
              symbol
            }
            rewardTokens {
              id
              type
              token {
                decimals
                name
                symbol
              }
            }
          }
        pool10: liquidityPool(id: $pool10Id) {
            id
            inputTokens{
              name
              symbol
            }
            rewardTokens {
              id
              type
              token {
                decimals
                name
                symbol
              }
            }
          }
      }
    `;
}


const fetchTokensOnLending = (): string => {
    return `
    query Data($pool1Id: String!, $pool2Id: String!,$pool3Id: String!,$pool4Id: String!,$pool5Id: String!,$pool6Id: String!,$pool7Id: String!,$pool8Id: String!,$pool9Id: String!,$pool10Id: String!) {
      pool1: market(id: $pool1Id) {
        id
        inputToken{
          name
          symbol
        }
        rewardTokens {
          id
          type
          token {
            decimals
            name
            symbol
          }
        }
      }
      pool2: market(id: $pool2Id) {
          id
          inputToken{
            name
            symbol
          }
          rewardTokens {
            id
            type
            token {
              decimals
              name
              symbol
            }
          }
        }
      pool3: market(id: $pool3Id) {
          id
          inputToken{
            name
            symbol
          }
          rewardTokens {
            id
            type
            token {
              decimals
              name
              symbol
            }
          }
        }
      pool4: market(id: $pool4Id) {
          id
          inputToken{
            name
            symbol
          }
          rewardTokens {
            id
            type
            token {
              decimals
              name
              symbol
            }
          }
        }
      pool5: market(id: $pool5Id) {
          id
          inputToken{
            name
            symbol
          }
          rewardTokens {
            id
            type
            token {
              decimals
              name
              symbol
            }
          }
        }
      pool6: market(id: $pool6Id) {
          id
          inputToken{
            name
            symbol
          }
          rewardTokens {
            id
            type
            token {
              decimals
              name
              symbol
            }
          }
        }
      pool7: market(id: $pool7Id) {
          id
          inputToken{
            name
            symbol
          }
          rewardTokens {
            id
            type
            token {
              decimals
              name
              symbol
            }
          }
        }
      pool8: market(id: $pool8Id) {
          id
          inputToken{
            name
            symbol
          }
          rewardTokens {
            id
            type
            token {
              decimals
              name
              symbol
            }
          }
        }
      pool9: market(id: $pool9Id) {
          id
          inputToken{
            name
            symbol
          }
          rewardTokens {
            id
            type
            token {
              decimals
              name
              symbol
            }
          }
        }
      pool10: market(id: $pool10Id) {
          id
          inputToken{
            name
            symbol
          }
          rewardTokens {
            id
            type
            token {
              decimals
              name
              symbol
            }
          }
        }
    }
  `;
}


const fetchTokensOnYield = (): string => {
    return `
    query Data($pool1Id: String!, $pool2Id: String!,$pool3Id: String!,$pool4Id: String!,$pool5Id: String!,$pool6Id: String!,$pool7Id: String!,$pool8Id: String!,$pool9Id: String!,$pool10Id: String!) {
      pool1: vault(id: $pool1Id) {
        id
        inputToken{
          name
          symbol
        }
        rewardTokens {
          id
          type
          token {
            decimals
            name
            symbol
          }
        }
      }
      pool2: vault(id: $pool2Id) {
          id
          inputToken{
            name
            symbol
          }
          rewardTokens {
            id
            type
            token {
              decimals
              name
              symbol
            }
          }
        }
      pool3: vault(id: $pool3Id) {
          id
          inputToken{
            name
            symbol
          }
          rewardTokens {
            id
            type
            token {
              decimals
              name
              symbol
            }
          }
        }
      pool4: vault(id: $pool4Id) {
          id
          inputToken{
            name
            symbol
          }
          rewardTokens {
            id
            type
            token {
              decimals
              name
              symbol
            }
          }
        }
      pool5: vault(id: $pool5Id) {
          id
          inputToken{
            name
            symbol
          }
          rewardTokens {
            id
            type
            token {
              decimals
              name
              symbol
            }
          }
        }
      pool6: vault(id: $pool6Id) {
          id
          inputToken{
            name
            symbol
          }
          rewardTokens {
            id
            type
            token {
              decimals
              name
              symbol
            }
          }
        }
      pool7: vault(id: $pool7Id) {
          id
          inputToken{
            name
            symbol
          }
          rewardTokens {
            id
            type
            token {
              decimals
              name
              symbol
            }
          }
        }
      pool8: vault(id: $pool8Id) {
          id
          inputToken{
            name
            symbol
          }
          rewardTokens {
            id
            type
            token {
              decimals
              name
              symbol
            }
          }
        }
      pool9: vault(id: $pool9Id) {
          id
          inputToken{
            name
            symbol
          }
          rewardTokens {
            id
            type
            token {
              decimals
              name
              symbol
            }
          }
        }
      pool10: vault(id: $pool10Id) {
          id
          inputToken{
            name
            symbol
          }
          rewardTokens {
            id
            type
            token {
              decimals
              name
              symbol
            }
          }
        }
    }
  `
}

const fetchTokensOnGeneric = (): string => {
    return `
    query Data($pool1Id: String!, $pool2Id: String!,$pool3Id: String!,$pool4Id: String!,$pool5Id: String!,$pool6Id: String!,$pool7Id: String!,$pool8Id: String!,$pool9Id: String!,$pool10Id: String!) {
      pool1: pool(id: $pool1Id) {
        id
        inputTokens{
          name
          symbol
        }
        rewardTokens {
          id
          type
          token {
            decimals
            name
            symbol
          }
        }
      }
      pool2: pool(id: $pool2Id) {
          id
          inputTokens{
            name
            symbol
          }
          rewardTokens {
            id
            type
            token {
              decimals
              name
              symbol
            }
          }
        }
      pool3: pool(id: $pool3Id) {
          id
          inputTokens{
            name
            symbol
          }
          rewardTokens {
            id
            type
            token {
              decimals
              name
              symbol
            }
          }
        }
      pool4: pool(id: $pool4Id) {
          id
          inputTokens{
            name
            symbol
          }
          rewardTokens {
            id
            type
            token {
              decimals
              name
              symbol
            }
          }
        }
      pool5: pool(id: $pool5Id) {
          id
          inputTokens{
            name
            symbol
          }
          rewardTokens {
            id
            type
            token {
              decimals
              name
              symbol
            }
          }
        }
      pool6: pool(id: $pool6Id) {
          id
          inputTokens{
            name
            symbol
          }
          rewardTokens {
            id
            type
            token {
              decimals
              name
              symbol
            }
          }
        }
      pool7: pool(id: $pool7Id) {
          id
          inputTokens{
            name
            symbol
          }
          rewardTokens {
            id
            type
            token {
              decimals
              name
              symbol
            }
          }
        }
      pool8: pool(id: $pool8Id) {
          id
          inputTokens{
            name
            symbol
          }
          rewardTokens {
            id
            type
            token {
              decimals
              name
              symbol
            }
          }
        }
      pool9: pool(id: $pool9Id) {
          id
          inputTokens{
            name
            symbol
          }
          rewardTokens {
            id
            type
            token {
              decimals
              name
              symbol
            }
          }
        }
      pool10: pool(id: $pool10Id) {
          id
          inputTokens{
            name
            symbol
          }
          rewardTokens {
            id
            type
            token {
              decimals
              name
              symbol
            }
          }
        }
    }
  `
}