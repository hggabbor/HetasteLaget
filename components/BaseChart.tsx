import {useEffect, useState} from "react";
import {AgCharts} from "ag-charts-react";
import {AgChartOptions, AgChartThemeName} from "ag-charts-types";
import {ChartType} from "ag-charts-community/dist/types/src/chart/factory/chartTypes";

export default function BaseChart({
                                      yAxisName = "CHANGE ME",
                                      type = "line",
                                      xKey = "",
                                      yKey = "",
                                      theme = "ag-material-dark",
                                      chartData = [],
                                      lineColor = "",
                                      title = ""
                                  } : {
    yAxisName: string;
    type: ChartType;
    xKey: string;
    yKey: string;
    theme: AgChartThemeName;
    chartData: [];
    lineColor: string;
    title: string;
}) {
    const [chartOptions, setChartOptions] = useState<AgChartOptions>({
        theme: theme,
        data: [],
        title: {
          enabled: true,
          text: title,
        },
        series: [
            {
                type: type,
                xKey: xKey,
                yKey: yKey,
                yName: yAxisName,
                stroke: lineColor,
                marker: {
                    fill: lineColor,
                    size: 8
                }
            }
            ],
    });

    useEffect(() => {
        setChartOptions((prevState) => {
            return {
                ...prevState,
                data: chartData,
            }
        })
    }, [chartData])

    return <AgCharts options={chartOptions}/>
}