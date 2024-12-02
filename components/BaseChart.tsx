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
                                  } : {
    yAxisName: string;
    type: ChartType;
    xKey: string;
    yKey: string;
    theme: AgChartThemeName;
    chartData: [];
    lineColor: string;
}) {
    const [chartOptions, setChartOptions] = useState<AgChartOptions>({
        theme: theme,
        data: [],
        // Series: Defines which chart type and data to use
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