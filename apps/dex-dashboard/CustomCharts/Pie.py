import copy
import config 
from utils import *
from pyecharts.charts import Pie
from pyecharts import options as opts

class CustomPieChart:
    def __init__(
        self,
        chart_title,
        yaxis_name='',
        xaxis_name='',
        height="1000px",
        xaxis_namegap=50,
        yaxis_namegap=50
    ):
        self.PIE_CHART = Pie(
            init_opts=opts.InitOpts(
                height=height, 
                width="100%", 
                bg_color="#232329"
            )
        )
        
        self.DEFAULT_TITLE_OPTS = copy.deepcopy(config.DEFAULT_TITLE_OPTS)
        self.DEFAULT_LEGEND_OPTS = copy.deepcopy(config.DEFAULT_LEGEND_OPTS)
        self.DEFAULT_TOOLTIP_OPTS = copy.deepcopy(config.DEFAULT_TOOLTIP_OPTS)
        self.DEFAULT_TOOLBOX_OPTS = copy.deepcopy(config.DEFAULT_TOOLBOX_OPTS)
        self.DEFAULT_XAXIS_OPTS = copy.deepcopy(config.DEFAULT_XAXIS_OPTS)
        self.DEFAULT_YAXIS_OPTS = copy.deepcopy(config.DEFAULT_YAXIS_OPTS)
        self.DEFAULT_DATAZOOM_OPTS = copy.deepcopy(config.DEFAULT_DATAZOOM_OPTS)
        
        self.DEFAULT_LEGEND_OPTS.update(
            show=True
        )
        self.DEFAULT_TOOLTIP_OPTS.update(
            show=True,
            trigger="item",
            formatter="{b}: {d}%"
        )
        
        self.DEFAULT_TITLE_OPTS.opts[0]['text'] = chart_title
        self.DEFAULT_XAXIS_OPTS.opts.update(
            name=xaxis_name,
            nameGap=xaxis_namegap
        )
        self.DEFAULT_YAXIS_OPTS.update(
            name=yaxis_name,
            nameGap=yaxis_namegap
        )

        self.PIE_CHART.set_global_opts(
            title_opts=self.DEFAULT_TITLE_OPTS,
            legend_opts=self.DEFAULT_LEGEND_OPTS,
            tooltip_opts=self.DEFAULT_TOOLTIP_OPTS,
            toolbox_opts=self.DEFAULT_TOOLBOX_OPTS,
            xaxis_opts=self.DEFAULT_XAXIS_OPTS,
            yaxis_opts=self.DEFAULT_YAXIS_OPTS,
            datazoom_opts=self.DEFAULT_DATAZOOM_OPTS
        )

    def add(
        self, series_name, data):
        self.PIE_CHART.add(
            data_pair=data,
            center=['30%', '50%'],
            radius=["40%", "65%"],
            series_name=series_name, 
            label_opts=opts.LabelOpts(is_show=False),
        )
