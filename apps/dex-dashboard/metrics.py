from utils import *
from config import *

from CustomCharts import CustomLineChart, CustomBarChart, CustomPieChart

class FinancialsDailySnapshots:
    def __init__(self, subgraph, subground, initial_timestamp):
        self.subgraph = subgraph
        self.subground = subground
        self.timestamp = initial_timestamp

        self.dataframe = self.query()

    def query(self):
        financial_daily_snapshot = self.subgraph.Query.financialsDailySnapshots(
            first=1000,
            where=[self.subgraph.FinancialsDailySnapshot.timestamp > self.timestamp],
        )

        dataframe = self.subground.query_df([financial_daily_snapshot])

        return dataframe

    def tvl_chart(self):
        chart = CustomLineChart(
            chart_title="Total Value Locked (USD)", xaxis_name="UTC", yaxis_name="Daily TVL"
        )

        # x_axis --> timestamp
        chart.add_xaxis(format_xaxis(self.dataframe.financialsDailySnapshots_id))

        # y_axis -->
        chart.add_yaxis(
            color="#12b8ff",
            series_name="TotalValueLocked",
            yaxis_data=self.dataframe.financialsDailySnapshots_totalValueLockedUSD.round(
                1
            ).to_list(),
        )

        return chart.LINE_CHART

    def volume_chart(self):
        chart = CustomLineChart(
            chart_title="Volume (USD)", xaxis_name="UTC", yaxis_name="Daily Volume"
        )

        xaxis_data = format_xaxis(self.dataframe.financialsDailySnapshots_id)
        # x_axis --> timestamp
        chart.add_xaxis(xaxis_data)

        # y_axis -->
        chart.add_yaxis(
            color="#12b8ff",
            series_name="New",
            yaxis_data=self.dataframe.financialsDailySnapshots_dailyVolumeUSD.round(
                1
            ).to_list(),
        )

        return chart.LINE_CHART

    def revenue_chart(self):
        chart = CustomBarChart(
            chart_title="Revenue (USD)",
            xaxis_name="UTC",
            yaxis_name="Revenue",
        )

        xaxis_data = format_xaxis(self.dataframe.financialsDailySnapshots_id)

        chart.add_xaxis_bar_chart(xaxis_data=xaxis_data)
        chart.add_xaxis_line_chart(xaxis_data=xaxis_data)

        chart.add_yaxis_bar_chart(
            series_name="Daily Supply Side Revenue (USD)",
            color="#5a66f9",
            yaxis_data=self.dataframe.financialsDailySnapshots_dailySupplySideRevenueUSD.round(
                1
            ).to_list(),
        )
        chart.add_yaxis_bar_chart(
            series_name="Daily Protocol Side Revenue (USD)",
            color="#6ac5c8",
            yaxis_data=self.dataframe.financialsDailySnapshots_dailyProtocolSideRevenueUSD.round(
                1
            ).to_list(),
        )

        chart.extend_axis(name="Total Revenue")

        chart.add_yaxis_line_chart(
            series_name="Daily Total Revenue (USD)",
            color="#fc03f8",
            yaxis_data=self.dataframe.financialsDailySnapshots_dailyTotalRevenueUSD.round(
                1
            ).to_list(),
        )

        return chart.BAR_CHART.overlap(chart.LINE_CHART)

    def cumulative_revenue_chart(self):
        chart = CustomLineChart(
            chart_title="Cumulative Revenue (USD)",
            xaxis_name="UTC",
            yaxis_name="Daily Cumulative Revenue",
            yaxis_namegap=45,
        )

        xaxis_data = format_xaxis(self.dataframe.financialsDailySnapshots_id)

        chart.add_xaxis(xaxis_data)

        chart.add_yaxis(
            color="#5a66f9",
            series_name="Supply Side Revenue (USD)",
            yaxis_data=self.dataframe.financialsDailySnapshots_cumulativeSupplySideRevenueUSD.round(
                1
            ).to_list(),
        )

        chart.add_yaxis(
            color="#fc03f8",
            series_name="Protocol Side Revenue (USD)",
            yaxis_data=self.dataframe.financialsDailySnapshots_cumulativeProtocolSideRevenueUSD.round(
                1
            ).to_list(),
        )

        chart.add_yaxis(
            color="#12b8ff",
            series_name="Total Side Revenue (USD)",
            yaxis_data=self.dataframe.financialsDailySnapshots_cumulativeTotalRevenueUSD.round(
                1
            ).to_list(),
        )

        return chart.LINE_CHART

class MetricsDailySnapshots:
    def __init__(self, subgraph, subground, initial_timestamp):
        self.subgraph = subgraph
        self.subground = subground
        self.timestamp = initial_timestamp

        self.dataframe = self.query()

    def query(self):
        metrics_daily_snapshot = self.subgraph.Query.usageMetricsDailySnapshots(
            first=1000,
            where=[self.subgraph.UsageMetricsDailySnapshot.timestamp > self.timestamp],
        )

        dataframe = self.subground.query_df([metrics_daily_snapshot])

        return dataframe

    def transactions_count_chart(self):
        chart = CustomBarChart(
            chart_title="Transactions",
            xaxis_name="UTC",
            yaxis_name="Count Of Transactions",
            logo_position=130
        )

        xaxis_data = format_xaxis(self.dataframe.usageMetricsDailySnapshots_id)

        chart.add_xaxis_bar_chart(xaxis_data=xaxis_data)
        chart.add_xaxis_line_chart(xaxis_data=xaxis_data)

        chart.add_yaxis_bar_chart(
            series_name="Daily Deposit Count",
            color="#5a66f9",
            yaxis_data=self.dataframe.usageMetricsDailySnapshots_dailyDepositCount.round(
                1
            ).to_list(),
        )
        chart.add_yaxis_bar_chart(
            series_name="Daily Withdraw Count",
            color="#6ac5c8",
            yaxis_data=self.dataframe.usageMetricsDailySnapshots_dailyWithdrawCount.round(
                1
            ).to_list(),
        )
        chart.add_yaxis_bar_chart(
            series_name="Daily Swap Count",
            color="#F2AA4CFF",
            yaxis_data=self.dataframe.usageMetricsDailySnapshots_dailySwapCount.round(
                1
            ).to_list(),
        )

        chart.extend_axis(name="Total Daily Transactions")

        chart.add_yaxis_line_chart(
            series_name="Daily Total Transactions",
            color="#fc03f8",
            yaxis_data=self.dataframe.usageMetricsDailySnapshots_dailyTransactionCount.round(
                1
            ).to_list(),
        )

        return chart.BAR_CHART.overlap(chart.LINE_CHART)

    def active_users_chart(self):
        chart = CustomLineChart(
            chart_title="Active Users",
            xaxis_name="UTC",
            yaxis_name="Count Of Users",
            logo_position=135
        )

        # x_axis --> timestamp
        chart.add_xaxis(format_xaxis(self.dataframe.usageMetricsDailySnapshots_id))

        # y_axis -->
        chart.add_yaxis(
            color="#12b8ff",
            series_name="Daily Active Users",
            yaxis_data=self.dataframe.usageMetricsDailySnapshots_dailyActiveUsers.round(
                1
            ).to_list(),
        )

        return chart.LINE_CHART

class LiquidityPools:
    def __init__(self, subgraph, subground, initial_timestamp=None):
        self.subgraph = subgraph
        self.subground = subground
        self.timestamp = initial_timestamp

        self.dataframe_tvl = self.query(orderBy=self.subgraph.LiquidityPool.totalValueLockedUSD)
        self.dataframe_volume = self.query(orderBy=self.subgraph.LiquidityPool.cumulativeVolumeUSD)

    def query(self, orderBy):
        pools = self.subgraph.Query.liquidityPools(
            first=10,
            orderBy=orderBy,
            orderDirection="desc",
        )

        dataframe = self.subground.query_df(
            [pools.id, pools.name, pools.totalValueLockedUSD, pools.cumulativeVolumeUSD]
        )

        return dataframe

    def top_10_pools_by_tvl(self):
        chart = CustomPieChart(
            chart_title="Top 10 Pools (By TVL)", 
        )
        chart.add(
            series_name="",
            data=[
                list(z)
                for z in zip(
                    self.dataframe_tvl.liquidityPools_name.to_list(),
                    self.dataframe_tvl.liquidityPools_totalValueLockedUSD.round(1).to_list(),
                )
            ],
        )
        return chart.PIE_CHART

    def top_10_pools_by_volume(self):
        chart = CustomPieChart(
            chart_title="Top 10 Pools (By Volume)", 
        )

        chart.add(
            series_name="",
            data=[
                list(z)
                for z in zip(
                    self.dataframe_volume.liquidityPools_name.to_list(),
                    self.dataframe_volume.liquidityPools_cumulativeVolumeUSD.round(1).to_list(),
                )
            ],
        )
        return chart.PIE_CHART
