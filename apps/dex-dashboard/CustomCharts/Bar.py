import copy 
import config
from utils import *
from pyecharts import options as opts
from pyecharts.charts import Bar, Line

class CustomBarChart:
    def __init__(
        self,
        chart_title,
        yaxis_name,
        xaxis_name,
        height="1000px",
        xaxis_namegap=20,
        yaxis_namegap=40,
        logo_position=70
    ):
        self.LINE_CHART = Line()
        self.BAR_CHART = Bar(
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
        
        self.BAR_CHART.set_global_opts(
            title_opts=self.DEFAULT_TITLE_OPTS,
            legend_opts=self.DEFAULT_LEGEND_OPTS,
            tooltip_opts=self.DEFAULT_TOOLTIP_OPTS,
            toolbox_opts=self.DEFAULT_TOOLBOX_OPTS,
            xaxis_opts=self.DEFAULT_XAXIS_OPTS,
            yaxis_opts=self.DEFAULT_YAXIS_OPTS,
            datazoom_opts=self.DEFAULT_DATAZOOM_OPTS
        )

    def add_xaxis_line_chart(self, xaxis_data):
        self.LINE_CHART.add_xaxis(xaxis_data)
    
    def add_xaxis_bar_chart(self, xaxis_data):
        self.BAR_CHART.add_xaxis(xaxis_data)
    
    def add_yaxis_bar_chart(self, series_name, color, yaxis_data):
        self.BAR_CHART.add_yaxis(
            series_name=series_name,
            y_axis=yaxis_data,
            itemstyle_opts=opts.ItemStyleOpts(color=color),
            label_opts=opts.LabelOpts(is_show=False)
        )
    
    def add_yaxis_line_chart(self, series_name, color, yaxis_data):
        self.LINE_CHART.add_yaxis(
            series_name=series_name,
            y_axis=yaxis_data,
            yaxis_index=1,
            itemstyle_opts=opts.ItemStyleOpts(color=color),
            label_opts=opts.LabelOpts(is_show=False)
        )
    
    def extend_axis(self, name):
        self.BAR_CHART.extend_axis(
            yaxis=opts.AxisOpts(
                name=name,
                type_="value",
                name_location="middle",
                name_gap=40,
                name_rotate=-90,
                name_textstyle_opts=opts.TextStyleOpts(
                    font_size=15,
                ),
                axislabel_opts=opts.LabelOpts(
                    formatter=yaxis_label_formatter()
                )
            )
        )
