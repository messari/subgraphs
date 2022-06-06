import copy 
import config
from utils import *
from pyecharts.charts import Line
from pyecharts import options as opts

class CustomLineChart:
    def __init__(
        self,
        chart_title,
        xaxis_name,
        yaxis_name,
        height="1000px",
        xaxis_namegap=30,
        yaxis_namegap=40,
        logo_position=70
    ):
        self.LINE_CHART = Line(
            init_opts=opts.InitOpts(
                width="100%", 
                height=height, 
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
        
        self.DEFAULT_TITLE_OPTS.opts[0]['text'] = chart_title
        self.DEFAULT_LEGEND_OPTS.update(
            show=False
        )
        self.DEFAULT_XAXIS_OPTS.update(
            name=xaxis_name,
            nameGap=xaxis_namegap
        )
        self.DEFAULT_YAXIS_OPTS.update(
            name=yaxis_name,
            nameGap=yaxis_namegap
        )
        
        self.LINE_CHART.set_global_opts(
            title_opts=self.DEFAULT_TITLE_OPTS,
            legend_opts=self.DEFAULT_LEGEND_OPTS,
            tooltip_opts=self.DEFAULT_TOOLTIP_OPTS,
            toolbox_opts=self.DEFAULT_TOOLBOX_OPTS,
            xaxis_opts=self.DEFAULT_XAXIS_OPTS,
            yaxis_opts=self.DEFAULT_YAXIS_OPTS,
            datazoom_opts=self.DEFAULT_DATAZOOM_OPTS,
        )
    
    def add_xaxis(self, xaxis_data):
        self.LINE_CHART.add_xaxis(xaxis_data)
    
    def add_yaxis(self, series_name, color, yaxis_data):
        self.LINE_CHART.add_yaxis(
            y_axis=yaxis_data,
            series_name=series_name,
            label_opts=opts.LabelOpts(is_show=False),
            itemstyle_opts=opts.ItemStyleOpts(color=color)
        )
