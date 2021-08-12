// Updates a box plot with the given data
function Update_BoxPlot(div_id, data_arrays, labels, y_label, colors, boxpoints = 'outliers') {
    // If all items in the first array are NULL, we have no data to display
    if (data_arrays.every(x => x.every(y => y == null))) {
        $('#' + div_id).html('<div class="alert alert-danger" role="alert">No data available</div >');
        return;
    }
    // Otherwise, draw the boxplot
    var data = []
    for (var i = 0; i < data_arrays.length; i++) {
        var array = data_arrays[i];
        var label = labels[i];
        data.push({
            y: array,
            boxpoints: boxpoints,
            jitter: 0.5,
            pointpos: 0,
            type: 'box',
            name: label,
            marker: { color: colors[i] },
        });
    }
    var layout = {
        showlegend: false,
        yaxis: { title: y_label }
    };
    Plotly.newPlot(div_id, data, layout,
        {
            responsive: true,
            toImageButtonOptions: {
                width: 2000,
                height: 1000,
            }
        }
    );
}

// Updates a histogram chart with the given data  
function Update_Hist_Chart(div_id, points, dist_line_x, dist_line_y, x_label, y_label,  bin_size, color) {
    var trace1 = {
        x: points,
        type: 'histogram',
        xbins: {
            size: bin_size
        },
        //xgap: 0.1,
        marker: { color: color },
    };
    var trace2 = {
        x: dist_line_x,
        y: dist_line_y,
        mode: 'lines',
        type: 'scatter',
        name: "Distribution line",
        marker: { color: color },
    }
    var layout = {
        margin: {
            t: 20,
            r: 20
        },
        bargap: 0.05,
        //bargroupgap: 0.2,
        barmode: "overlay",
        hovermode: 'closest',
        xaxis: { title: x_label },
        yaxis: { title: y_label }
    };
    var data = [trace1, trace2];
    Plotly.newPlot(div_id, data, layout, { responsive: true });
}

// Updates a scatter chart with the given data
function Update_Scatter_Chart(div_id, x_data, y_data, x_reg, y_reg, path, title, x_label, y_label, colors) {
    // If all items in either array are null, we have no data to display
    if (x_data.every(x => x == null) || y_data.every(x => x == null)) {
        $('#' + div_id).html('<div class="alert alert-danger" role="alert">No data available</div >');
        return;
    }
    // Otherwise, draw the scatter chart
    var trace1 = {
        x: x_data,
        y: y_data,
        mode: 'markers',
        type: 'scatter',
        name: "",
        marker: { color: colors[0] },
    }
    var trace2 = {
        x: x_reg,
        y: y_reg,
        mode: 'lines',
        type: 'scatter',
        name: "Regresion line",
        marker: { color: colors[1] },
    }
    var layout = {
        margin: {
            r: 20
        },
        title: { text: title },
        xaxis: { title: x_label },
        yaxis: { title: y_label },
        showlegend: false,
        shapes: [
            {
                line: {
                    color: 'rgba(26, 187, 156, 0.25)',
                    width: 0.1
                },
                path: path,
                type: 'path',
                fillcolor: 'rgba(26, 187, 156, 0.25)'
            }
        ], 
    };
    var data = [trace1, trace2];
    Plotly.newPlot(div_id, data, layout, { responsive: true });
}

function Update_Doughnut_Chart(div_id, labels, data, title, x_label, y_label) {
    var data = [
        {
            labels: labels,
            values: data,
            type: 'pie',
            hole: .4,
            hoverinfo: 'label+percent',
            marker: {
                colors: COLORS_5
            }
        }
    ];
    var layout = {
        margin: {
            r: 20
        },
        title: { text: title },
        xaxis: { title: x_label },
        yaxis: { title: y_label },
    };
    Plotly.newPlot(div_id, data, layout, { responsive: true });
}

function Update_Bar_Chart(div_id, labels, data, title, x_label, y_label) {
    var data = [
        {
            x: labels,
            y: data,
            type: 'bar'
        }
    ];
    var layout = {
        margin: {
            r: 20
        },
        title: { text: title },
        xaxis: { title: x_label },
        yaxis: { title: y_label },
    };
    Plotly.newPlot(div_id, data, layout, { responsive: true });
}

// Updates a doble histogram
function Update_Double_Hist_Chart(div_id, points1, points2, x_label, y_label, bin_size, color) {
    var trace1 = {
        x: points1,
        type: 'histogram',
        xbins: {
            size: bin_size
        },
        xgap: 0.1,
        opacity: 0.6,
        name: '6q HLA del',
        marker: { color: color },
    };
    var trace2 = {
        x: points2,
        type: 'histogram',
        xbins: {
            size: bin_size
        },
        xgap: 0.1,
        opacity: 0.6,
        name: '6q HLA NO del',
        marker: { color: color },
    };
    var layout = {
        margin: {
            t: 20,
            r: 20
        },
        bargap: 0.05,
        bargroupgap: 0.2,
        barmode: "overlay",
        xaxis: { title: x_label },
        yaxis: { title: y_label }
    };
    var data = [trace1, trace2];
    Plotly.newPlot(div_id, data, layout, { responsive: true });
}

function Draw3DGraph(x_data, y_data, z_data, x_label, y_label, z_label) {
    // Draw graph
    var trace1 = {
        x: x_data,
        y: y_data,
        z: z_data,
        mode: 'markers',
        marker: {
            size: 12,
            line: {
                color: 'rgba(217, 217, 217, 0.14)',
                width: 0.5
            },
            opacity: 0.8
        },
        type: 'scatter3d'
    };
    var layout = {
        scene: {
            xaxis: { title: x_label.toUpperCase() },
            yaxis: { title: y_label.toUpperCase() },
            zaxis: { title: z_label.toUpperCase() }
        },
        margin: { l: 0, r: 0, b: 0, t: 0 }
    };
    Plotly.newPlot('3d_graph', [trace1], layout);
}

function DrawStackedBarGraph(div_id, data, labels, labels_detail, colors) {
    var traces = []
    for (var i = 0; i < data.length; i++) {
        var newTrace = {
            x: [labels[i]],
            y: [data[i]],
            name: labels_detail[i],
            type: 'bar',
            marker: { color: colors[i] },
        }
        traces.push(newTrace)
    }

    var layout = {
        barmode: 'stack', showlegend: false, yaxis: { zeroline: false }
    };
    Plotly.newPlot(div_id, traces, layout, {
        responsive: true,
        toImageButtonOptions: {
            width: 2000,
            height: 1000,
        }
    });
}