import pandas as pd

class SwapTransactions:
    def __init__(self, subgraph, subground, initial_timestamp=None):
        self.subgraph = subgraph
        self.subground = subground
        self.timestamp = initial_timestamp
        self.columns_order = [
            'Date', 'blockNumber', 'from', 'tokenIn', 'amountIn',
            'amountInUSD', 'tokenOut', 'amountOut', 'amountOutUSD'
        ]
        self.dataframe = self.query()

    def query(self):
        swaps = self.subgraph.Query.swaps(
            first=15,
            orderBy=self.subgraph.Swap.timestamp,
            orderDirection="desc",
        )

        dataframe = self.subground.query_df([swaps])
        
        if dataframe.empty:
            return dataframe
        
        dataframe.columns = [
            "id", "hash", "logIndex", "protocol_id", "to", "from", "blockNumber", "Date", "tokenIn",
            "amountIn", "amountInUSD", "tokenOut", "amountOut", "amountOutUSD", "pool_id",
        ]

        dataframe.drop(
            ["id", "to", "logIndex", "protocol_id", "pool_id"], axis=1, inplace=True
        )
        dataframe['hash'] = dataframe['hash'].map(str)
        dataframe['blockNumber'] = dataframe['blockNumber'].map(int)
        dataframe['Date'] = pd.to_datetime(dataframe['Date'].map(int), unit='s')
        dataframe['tokenIn'] = dataframe['tokenIn'].map(str)
        dataframe['amountIn'] = dataframe['amountIn'].map(str)
        dataframe['amountInUSD'] = dataframe['amountInUSD'].map(float)
        dataframe['tokenOut'] = dataframe['tokenOut'].map(str)
        dataframe['amountOut'] = dataframe['amountOut'].map(str)
        dataframe['amountOutUSD'] = dataframe['amountOutUSD'].map(float)

        dataframe = dataframe.reindex(columns=self.columns_order)
        
        return dataframe

class DepositTransactions:
    def __init__(self, subgraph, subground, initial_timestamp=None):
        self.subgraph = subgraph
        self.subground = subground
        self.timestamp = initial_timestamp
        self.columns_order = [
            'Date', 'blockNumber', 'from', 'outputToken', 'outputTokenAmount',
            'outputTokenAmountUSD'
        ]
        self.dataframe = self.query()

    def query(self):
        swaps = self.subgraph.Query.deposits(
            first=15,
            orderBy=self.subgraph.Deposit.timestamp,
            orderDirection="desc",
        )

        dataframe = self.subground.query_df([swaps])

        if dataframe.empty:
            return dataframe
        
        dataframe.columns = [
            'id', 'hash', 'logIndex','protocol_id', 'to', 'from', 'blockNumber', 
            'Date', 'outputToken', 'outputTokenAmount', 'outputTokenAmountUSD', 'pool_id'
        ]

        dataframe.drop(
            ["id", "to", "logIndex", "protocol_id", "pool_id"], axis=1, inplace=True
        )
        dataframe['hash'] = dataframe['hash'].map(str)
        dataframe['blockNumber'] = dataframe['blockNumber'].map(int)
        dataframe['Date'] = pd.to_datetime(dataframe['Date'].map(int), unit='s')
        dataframe['outputToken'] = dataframe['outputToken'].map(str)
        dataframe['outputTokenAmount'] = dataframe['outputTokenAmount'].map(float)
        dataframe['outputTokenAmountUSD'] = dataframe['outputTokenAmountUSD'].map(str)

        dataframe = dataframe.reindex(columns=self.columns_order)
        
        return dataframe

class WithdawTransactions:
    def __init__(self, subgraph, subground, initial_timestamp=None):
        self.subgraph = subgraph
        self.subground = subground
        self.timestamp = initial_timestamp
        self.columns_order = [
            'Date', 'blockNumber', 'from', 'outputToken', 'outputTokenAmount',
            'outputTokenAmountUSD'
        ]
        self.dataframe = self.query()

    def query(self):
        swaps = self.subgraph.Query.withdraws(
            first=15,
            orderBy=self.subgraph.Withdraw.timestamp,
            orderDirection="desc",
        )

        dataframe = self.subground.query_df([swaps])

        if dataframe.empty:
            return dataframe
        
        dataframe.columns = [
            'id', 'hash', 'logIndex', 'protocol_id', 'to', 'from', 'blockNumber', 
            'Date', 'outputToken', 'outputTokenAmount', 'outputTokenAmountUSD', 'pool_id'
        ]

        dataframe.drop(
            ["id", "to", "logIndex", "protocol_id", "pool_id"], axis=1, inplace=True
        )
        dataframe['hash'] = dataframe['hash'].map(str)
        dataframe['blockNumber'] = dataframe['blockNumber'].map(int)
        dataframe['Date'] = pd.to_datetime(dataframe['Date'].map(int), unit='s')
        dataframe['outputToken'] = dataframe['outputToken'].map(str)
        dataframe['outputTokenAmount'] = dataframe['outputTokenAmount'].map(float)
        dataframe['outputTokenAmountUSD'] = dataframe['outputTokenAmountUSD'].map(str)

        dataframe = dataframe.reindex(columns=self.columns_order)
        
        return dataframe
