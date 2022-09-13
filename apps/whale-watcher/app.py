import streamlit as st
from streamlit_autorefresh import st_autorefresh
import pandas as pd
from datetime import datetime
from subgrounds.subgrounds import Subgrounds

# Refresh every 10 seconds
REFRESH_INTERVAL_SEC = 10

EXPLORERS = {
    "mainnet": "etherscan.io",
    "matic": "polygonscan.com",
    "optimism": "optimistic.etherscan.io",
    "arbitrum_one": "arbiscan.io",
}


sg = Subgrounds()
subgraphs = {
    "mainnet": sg.load_subgraph(
        "https://api.thegraph.com/subgraphs/name/messari/uniswap-v3-ethereum"
    ),
    "matic": sg.load_subgraph(
        "https://api.thegraph.com/subgraphs/name/messari/uniswap-v3-polygon"
    ),
    "optimism": sg.load_subgraph(
        "https://api.thegraph.com/subgraphs/name/messari/uniswap-v3-optimism"
    ),
    "arbitrum_one": sg.load_subgraph(
        "https://api.thegraph.com/subgraphs/name/messari/uniswap-v3-arbitrum"
    ),
}


def fetch_data(subgraph, amount_in_usd_gte):
    latest_swaps = subgraph.Query.swaps(
        where=[subgraph.Swap.amountInUSD >= amount_in_usd_gte],
        orderBy=subgraph.Swap.timestamp,
        orderDirection="desc",
        first=10,
    )
    df = sg.query_df(
        [
            latest_swaps.hash,
            latest_swaps.protocol.name,
            latest_swaps.protocol.network,
            latest_swaps.timestamp,
            latest_swaps.tokenIn.symbol,
            latest_swaps.amountInUSD,
            latest_swaps.tokenOut.symbol,
            latest_swaps.amountOutUSD,
        ]
    )
    df = df.rename(columns=lambda x: x[len("swaps_") :])
    df["time"] = df["timestamp"].apply(
        lambda x: datetime.fromtimestamp(x).strftime("%H:%M:%S")
    )
    df["dex"] = df["protocol_name"]
    df["network"] = df["protocol_network"]

    df["amountInUSD"] = df["amountInUSD"].map("{:,.2f}".format)
    df["amountOutUSD"] = df["amountOutUSD"].map("{:,.2f}".format)
    df["swap"] = df.apply(
        lambda x: f"""\${x["amountInUSD"]} {x["tokenIn_symbol"]} 💸 \${x["amountOutUSD"]} {x["tokenOut_symbol"]}""",
        axis=1,
    )
    df["txn"] = df.apply(
        lambda x: f"""[🔗](https://{EXPLORERS[x["protocol_network"].lower()]}/tx/{x["hash"]})""",
        axis=1,
    )
    return df[["time", "dex", "network", "swap", "txn"]]


st.set_page_config(page_icon="🐋")
ticker = st_autorefresh(interval=REFRESH_INTERVAL_SEC * 1000, key="ticker")
st.title("🐋 Whale Watcher")

networks = st.multiselect(
    "Select networks",
    ["mainnet", "matic", "optimism", "arbitrum_one"],
    ["mainnet", "matic"],
)

amount_in_usd_gte = st.select_slider(
    "Only display swaps with amount >=",
    value=100,
    options=[100, 1000, 10000, 100000],
    key="amount_in_usd_gte",
)

data_loading = st.text(f"[Every {REFRESH_INTERVAL_SEC} seconds] Loading data...")
df = pd.concat(
    map(lambda x: fetch_data(subgraphs[x], amount_in_usd_gte), networks), axis=0
)
df = df.sort_values(by=["time"], ascending=False)
data_loading.text(f"[Every {REFRESH_INTERVAL_SEC} seconds] Loading data... done!")
st.markdown(df.to_markdown())
