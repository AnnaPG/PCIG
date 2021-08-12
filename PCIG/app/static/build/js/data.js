// Updates all the header counters for a given cancer type
function UpdateCounters(cancer_type = "") {
    // AJAX call to get_data_counters
    $.ajax({
        method: "GET",
        url: "get_data_counters/",
        data: {
            "cancer_type": cancer_type
        },
        success: function (response_data) {
            // Hide all spinners and show the counters
            $('.counter_loading_spinner').hide();
            $('.count_middle').show();
            // Update all header counters with the returned data
            $('#header_samples').html(response_data.samples);
            $('#header_samples_percentage').html((response_data.samples / response_data.total_samples * 100).toFixed(2) + '% of total');
            $('#header_avg_age').html(response_data.avg_age);
            if (response_data.avg_age == 0) {
                $('#header_avg_age').addClass('red');
                $('#header_avg_age').html('NA');
            }
            else $('#header_avg_age').removeClass('red');
            $('#header_age_range').html('[' + response_data.min_age + ', ' + response_data.max_age + ']');
            $('#header_gender_female').html(response_data.females);
            $('#header_female_percentage').html((response_data.females / response_data.samples * 100).toFixed(2) + '% of total');
            $('#header_gender_male').html(response_data.males);
            $('#header_male_percentage').html((response_data.males / response_data.samples * 100).toFixed(2) + '% of total');
            $('#header_samples_exp').html(response_data.samples_exp);
            if (response_data.samples_exp == 0) {
                $('#header_samples_exp').addClass('red');
                $('#header_samples_exp').html('NA');
                $('#data_IG_not_available').html('<div class="alert alert-danger" role="alert">No data available</div >');
                $('#correlations_IG').hide();
            } else {
                $('#header_samples_exp').removeClass('red');
                $('#correlations_IG').show();
            }
            $('#header_exp_percentage').html((response_data.samples_exp / response_data.samples * 100).toFixed(2) + '% of total');
            $('#header_samples_cna').html(response_data.samples_cna);
            $('#header_cna_percentage').html((response_data.samples_cna / response_data.samples * 100).toFixed(2) + '% of total');
            $('#header_samples_tmb').html(response_data.samples_tmb);
            $('#header_tmb_percentage').html((response_data.samples_tmb / response_data.samples * 100).toFixed(2) + '% of total');
            $('#header_samples_sv').html(response_data.samples_sv);
            $('#header_sv_percentage').html((response_data.samples_sv / response_data.samples * 100).toFixed(2) + '% of total');
        },
        error: function (data) {
            console.log("Error");
            console.log(data);
        }
    })
};

// Updates all charts
function Update_Charts(cancer_type, indels) {
    // Ajax call to get all charts data
    $.ajax({
        method: "GET",
        url: "get_charts_data/",
        data: {
            "cancer_type": cancer_type,
            "indels": indels
        },
        success: function (response_data) {
            console.log(response_data);
            // Update all IPS, CNA, TMB, SV charts
            Update_Scores_Charts(response_data.data_scores);
            // Update histogram SV effect
            Update_Doughnut_Chart('sv_effect', response_data.sv_effect.labels, response_data.sv_effect.n_effect, "", "", "");
            // Update nCNA
            //Update_nCNA_Chart(response_data.cna);
            // Update CTH
            Update_BoxPlot("bcs_cth", [response_data.cth.bcs_yes, response_data.cth.bcs_no], ["Yes", "No"], "BCS", COLORS_2[2], 'all');
            Update_BoxPlot("fcs_cth", [response_data.cth.fcs_yes, response_data.cth.fcs_no], ["Yes", "No"], "FCS", COLORS_2[2], 'all');
            // Update Wilcoxon values
            Update_Wilcoxon("wilcoxon_cth_bcs", response_data.cth.wilcoxon_cth_bcs);
            Update_Wilcoxon("wilcoxon_cth_fcs", response_data.cth.wilcoxon_cth_fcs);

            //Update q6-HLA del 
            //Update_Double_Hist_Chart("hla_mhc", response_data.hla_del.mhc_HLA_del, response_data.hla_del.mhc_HLA_no_del, "MHC", "Frequency", "", "")
            Update_BoxPlot("hla_mhc", [response_data.hla_del.mhc_HLA_del, response_data.hla_del.mhc_HLA_no_del], ["Yes", "No"], "MHC", COLORS_2[2], 'all');
            Update_BoxPlot("hla_ec", [response_data.hla_del.ec_HLA_del, response_data.hla_del.ec_HLA_no_del], ["Yes", "No"], "EC", COLORS_2[2], 'all');
            Update_BoxPlot("hla_sc", [response_data.hla_del.sc_HLA_del, response_data.hla_del.sc_HLA_no_del], ["Yes", "No"], "SC", COLORS_2[2], 'all');
            Update_BoxPlot("hla_cp", [response_data.hla_del.cp_HLA_del, response_data.hla_del.cp_HLA_no_del], ["Yes", "No"], "CP", COLORS_2[2], 'all');
            Update_BoxPlot("hla_stromalscore", [response_data.hla_del.stromal_HLA_del, response_data.hla_del.stromal_HLA_no_del], ["Yes", "No"], "StromalScore", COLORS_2[2], 'all');
            Update_BoxPlot("hla_immunescore", [response_data.hla_del.immune_HLA_del, response_data.hla_del.immune_HLA_no_del], ["Yes", "No"], "ImmuneScore", COLORS_2[2], 'all');

            // Update all the Wilcoxon values
            Update_Wilcoxon("wilcoxon_mhc", response_data.hla_del.wilcoxon_mhc);
            Update_Wilcoxon("wilcoxon_ec", response_data.hla_del.wilcoxon_ec);
            Update_Wilcoxon("wilcoxon_sc", response_data.hla_del.wilcoxon_sc);
            Update_Wilcoxon("wilcoxon_cp", response_data.hla_del.wilcoxon_cp);
            Update_Wilcoxon("wilcoxon_stromal", response_data.hla_del.wilcoxon_stromal);
            Update_Wilcoxon("wilcoxon_immune", response_data.hla_del.wilcoxon_immune);

            // Hide overlay
            $("#overlay").hide();
        },
        error: function (data) {
            console.log("Error");
            console.log(data);
        }})
}

// Updates all the BCS and FCS charts for a given cancer type
function Update_Scores_Charts(response_data) {
    // Update all charts APG
    Update_Scatter_Chart("bcs_mhc", response_data.data["bcs"], response_data.data["mhc"],
        response_data.confidence_interval["bcs_mhc"].x_reg, response_data.confidence_interval["bcs_mhc"].y_reg, response_data.confidence_interval["bcs_mhc"].path, "BCS vs MHC", "BCS", "MHC", COLORS_2[0]);
    Update_Scatter_Chart("bcs_cp", response_data.data["bcs"], response_data.data["cp"],
        response_data.confidence_interval["bcs_cp"].x_reg, response_data.confidence_interval["bcs_cp"].y_reg, response_data.confidence_interval["bcs_cp"].path, "BCS vs CP", "BCS", "CP", COLORS_2[1]);
    Update_Scatter_Chart("bcs_ec", response_data.data["bcs"], response_data.data["ec"],
        response_data.confidence_interval["bcs_ec"].x_reg, response_data.confidence_interval["bcs_ec"].y_reg, response_data.confidence_interval["bcs_ec"].path, "BCS vs EC", "BCS", "EC", COLORS_2[2]);
    Update_Scatter_Chart("bcs_sc", response_data.data["bcs"], response_data.data["sc"],
        response_data.confidence_interval["bcs_sc"].x_reg, response_data.confidence_interval["bcs_sc"].y_reg, response_data.confidence_interval["bcs_sc"].path, "BCS vs SC", "BCS", "SC", COLORS_2[3]);
    Update_Scatter_Chart("fcs_mhc", response_data.data["fcs"], response_data.data["mhc"],
        response_data.confidence_interval["fcs_mhc"].x_reg, response_data.confidence_interval["fcs_mhc"].y_reg, response_data.confidence_interval["fcs_mhc"].path, "FCS vs MHC", "FCS", "MHC", COLORS_2[0]);
    Update_Scatter_Chart("fcs_cp", response_data.data["fcs"], response_data.data["cp"],
        response_data.confidence_interval["fcs_cp"].x_reg, response_data.confidence_interval["fcs_cp"].y_reg, response_data.confidence_interval["fcs_cp"].path, "FCS vs CP", "FCS", "CP", COLORS_2[1]);
    Update_Scatter_Chart("fcs_ec", response_data.data["fcs"], response_data.data["ec"], 
        response_data.confidence_interval["fcs_ec"].x_reg, response_data.confidence_interval["fcs_ec"].y_reg, response_data.confidence_interval["fcs_ec"].path, "FCS vs EC", "FCS", "EC", COLORS_2[2]);
    Update_Scatter_Chart("fcs_sc", response_data.data["fcs"], response_data.data["sc"],
        response_data.confidence_interval["fcs_sc"].x_reg, response_data.confidence_interval["fcs_sc"].y_reg, response_data.confidence_interval["fcs_sc"].path, "FCS vs SC", "FCS", "SC", COLORS_2[3]);

    Update_Scatter_Chart("bcs_chemokine_avg", response_data.data["bcs"], response_data.data["chemokine_avg"],
        response_data.confidence_interval["bcs_chemokine_avg"].x_reg, response_data.confidence_interval["bcs_chemokine_avg"].y_reg, response_data.confidence_interval["bcs_chemokine_avg"].path, "BCS vs Chemokine AVG", "BCS", "Chemokine AVG", COLORS_2[3]);
    Update_Scatter_Chart("fcs_chemokine_avg", response_data.data["fcs"], response_data.data["chemokine_avg"],
        response_data.confidence_interval["fcs_chemokine_avg"].x_reg, response_data.confidence_interval["fcs_chemokine_avg"].y_reg, response_data.confidence_interval["fcs_chemokine_avg"].path, "FCS vs Chemokine AVG", "FCS", "Chemokine AVG", COLORS_2[3]);

    Update_Scatter_Chart("bcs_stromalscore", response_data.data["bcs"], response_data.data["stromalscore"],
        response_data.confidence_interval["bcs_stromalscore"].x_reg, response_data.confidence_interval["bcs_stromalscore"].y_reg, response_data.confidence_interval["bcs_stromalscore"].path, "BCS vs StromalScore", "BCS", "StromalScore", COLORS_2[3]);
    Update_Scatter_Chart("fcs_stromalscore", response_data.data["fcs"], response_data.data["stromalscore"],
        response_data.confidence_interval["fcs_stromalscore"].x_reg, response_data.confidence_interval["fcs_stromalscore"].y_reg, response_data.confidence_interval["fcs_stromalscore"].path, "FCS vs StromalScore", "FCS", "StromalScore", COLORS_2[3]);
    Update_Scatter_Chart("bcs_immunescore", response_data.data["bcs"], response_data.data["immunescore"],
        response_data.confidence_interval["bcs_immunescore"].x_reg, response_data.confidence_interval["bcs_immunescore"].y_reg, response_data.confidence_interval["bcs_immunescore"].path, "BCS vs ImmuneScore", "BCS", "ImmuneScore", COLORS_2[3]);
    Update_Scatter_Chart("fcs_immunescore", response_data.data["fcs"], response_data.data["immunescore"],
        response_data.confidence_interval["fcs_immunescore"].x_reg, response_data.confidence_interval["fcs_immunescore"].y_reg, response_data.confidence_interval["fcs_immunescore"].path, "FCS vs ImmuneScore", "FCS", "ImmuneScore", COLORS_2[3]);

    //// TMB
    Update_Scatter_Chart("bcs_tmb", response_data.data["bcs"], response_data.data["tmb"],
        response_data.confidence_interval["bcs_tmb"].x_reg, response_data.confidence_interval["bcs_tmb"].y_reg, response_data.confidence_interval["bcs_tmb"].path, "BCS vs Number of mutations", "BCS", "Number of mutations", COLORS_2[0]);
    Update_Scatter_Chart("fcs_tmb", response_data.data["fcs"], response_data.data["tmb"],
        response_data.confidence_interval["fcs_tmb"].x_reg, response_data.confidence_interval["fcs_tmb"].y_reg, response_data.confidence_interval["fcs_tmb"].path, "FCS vs Number of mutations", "FCS", "Number of mutations", COLORS_2[0]);
    Update_Scatter_Chart("mhc_tmb", response_data.data["mhc"], response_data.data["tmb"],
        response_data.confidence_interval["mhc_tmb"].x_reg, response_data.confidence_interval["mhc_tmb"].y_reg, response_data.confidence_interval["mhc_tmb"].path, "MHC vs Number of mutations", "MHC", "Number of mutations", COLORS_2[0]);
    Update_Scatter_Chart("cp_tmb", response_data.data["cp"], response_data.data["tmb"],
        response_data.confidence_interval["cp_tmb"].x_reg, response_data.confidence_interval["cp_tmb"].y_reg, response_data.confidence_interval["cp_tmb"].path, "CP vs Number of mutations", "CP", "Number of mutations", COLORS_2[1]);
    Update_Scatter_Chart("ec_tmb", response_data.data["ec"], response_data.data["tmb"],
        response_data.confidence_interval["ec_tmb"].x_reg, response_data.confidence_interval["ec_tmb"].y_reg, response_data.confidence_interval["ec_tmb"].path, "EC vs Number of mutations", "EC", "Number of mutations", COLORS_2[2]);
    Update_Scatter_Chart("sc_tmb", response_data.data["sc"], response_data.data["tmb"],
        response_data.confidence_interval["sc_tmb"].x_reg, response_data.confidence_interval["sc_tmb"].y_reg, response_data.confidence_interval["sc_tmb"].path, "SC vs Number of mutations", "SC", "Number of mutations", COLORS_2[3]);
    Update_Scatter_Chart("tmb_stromalscore", response_data.data["tmb"], response_data.data["stromalscore"],
        response_data.confidence_interval["tmb_stromalscore"].x_reg, response_data.confidence_interval["tmb_stromalscore"].y_reg, response_data.confidence_interval["tmb_stromalscore"].path, "Number of mutations vs StromalScore", "Number of mutations", "StromalScore", COLORS_2[3]);
    Update_Scatter_Chart("tmb_immunescore", response_data.data["tmb"], response_data.data["immunescore"],
        response_data.confidence_interval["tmb_immunescore"].x_reg, response_data.confidence_interval["tmb_immunescore"].y_reg, response_data.confidence_interval["tmb_immunescore"].path, "Number of mutations vs ImmuneScore", "Number of mutations", "ImmuneScore", COLORS_2[3]);

    // Update all the spearman values
    Update_Spearman("bcs_mhc", response_data.spearman["bcs_mhc"]);
    Update_Spearman("bcs_cp", response_data.spearman["bcs_cp"]);
    Update_Spearman("bcs_ec", response_data.spearman["bcs_ec"]);
    Update_Spearman("bcs_sc", response_data.spearman["bcs_sc"]);
    Update_Spearman("bcs_ploidy", response_data.spearman["bcs_ploidy"]);
    Update_Spearman("bcs_chemokine_avg", response_data.spearman["bcs_chemokine_avg"]);
    Update_Spearman("bcs_stromalscore", response_data.spearman["bcs_stromalscore"]);
    Update_Spearman("bcs_immunescore", response_data.spearman["bcs_immunescore"]);
    Update_Spearman("fcs_mhc", response_data.spearman["fcs_mhc"]);
    Update_Spearman("fcs_cp", response_data.spearman["fcs_cp"]);
    Update_Spearman("fcs_ec", response_data.spearman["fcs_ec"]);
    Update_Spearman("fcs_sc", response_data.spearman["fcs_sc"]);
    Update_Spearman("fcs_ploidy", response_data.spearman["fcs_ploidy"]);
    Update_Spearman("fcs_chemokine_avg", response_data.spearman["fcs_chemokine_avg"]);
    Update_Spearman("fcs_stromalscore", response_data.spearman["fcs_stromalscore"]);
    Update_Spearman("fcs_immunescore", response_data.spearman["fcs_immunescore"]);
    Update_Spearman("bcs_tmb", response_data.spearman["bcs_tmb"]);
    Update_Spearman("fcs_tmb", response_data.spearman["fcs_tmb"]);
    Update_Spearman("mhc_tmb", response_data.spearman["mhc_tmb"]);
    Update_Spearman("cp_tmb", response_data.spearman["cp_tmb"]);
    Update_Spearman("ec_tmb", response_data.spearman["ec_tmb"]);
    Update_Spearman("sc_tmb", response_data.spearman["sc_tmb"]);
    Update_Spearman("tmb_stromalscore", response_data.spearman["tmb_stromalscore"]);
    Update_Spearman("tmb_immunescore", response_data.spearman["tmb_immunescore"]);
    Update_Spearman("bcs_fcs", response_data.spearman["bcs_fcs"]);
    Update_Spearman("sv_ploidy", response_data.spearman["sv_ploidy"]);

    // Update the IPS class chart
    Update_BoxPlot("ips_class", [response_data.data["mhc"], response_data.data["cp"], response_data.data["ec"], response_data.data["sc"]], ["MHC", "CP", "EC", "SC"], "IPS classes values", COLORS_5, 'all');
    Update_BoxPlot("estimate_scores", [response_data.data["stromalscore"], response_data.data["immunescore"]], ["Stromal", "Immune"], "ESTIMATE scores values", COLORS_2[3], 'all');
    //Update_Hist_Chart('bcs_dist', response_data.data["bcs"], response_data.distribution_curve["bcs_curve"].dist_line_x, response_data.distribution_curve["bcs_curve"].dist_line_y, "BCS", "Frequency", null, COLORS_5[4]);
    Update_Hist_Chart('bcs_dist', response_data.data["bcs"], "", "", "BCS", "Frequency", null, COLORS_5[4]);
    //Update_Hist_Chart('fcs_dist', response_data.data["fcs"], response_data.distribution_curve["fcs_curve"].dist_line_x, response_data.distribution_curve["fcs_curve"].dist_line_y, "FCS", "Frequency", null, COLORS_5[4]);
    Update_Hist_Chart('fcs_dist', response_data.data["fcs"], "", "", "FCS", "Frequency", null, COLORS_5[4]);
    //Update_Hist_Chart('ploidy_dist', response_data.data["ploidy"], response_data.distribution_curve["ploidy_curve"].dist_line_x, response_data.distribution_curve["ploidy_curve"].dist_line_y, "Ploidy", "Frequency", null, COLORS_5[2]);
    //Update_Hist_Chart('ploidy_dist', response_data.data["ploidy"],"", "", "Ploidy", "Frequency", null, COLORS_5[2]);
    // Update SV
    //Update_Hist_Chart('sv_dist', response_data.data["sv"], response_data.distribution_curve["sv_curve"].dist_line_x, response_data.distribution_curve["sv_curve"].dist_line_y, "SV", "Frequency", null, COLORS_5[3]);
    Update_Hist_Chart('sv_dist', response_data.data["sv"], "", "", "SV", "Frequency", null, COLORS_5[3]);
    // Update TMB charts
    //Update_Hist_Chart('tmb_dist', response_data.data["tmb"], response_data.distribution_curve["tmb_curve"].dist_line_x, response_data.distribution_curve["tmb_curve"].dist_line_y, "ML", "Frequency", null, COLORS_5[1]);
    Update_Hist_Chart('tmb_dist', response_data.data["tmb"], "", "", "Number of mutations", "Frequency", null, COLORS_5[1]);

    // Fill IPS table
    FillTable(response_data.spearman, ["mhc", "ec", "sc", "cp","b2m", "tap1", "tap2", "hla_a", "hla_b", "hla_c", "hla_dpa1", "hla_dpb1", "hla_e", "hla_f", "pdcd1", "ctla4", "lag3", "tigit", "timm13", "cd27", "icos", "act_cd4", "act_cd8",
                                        "tem_cd4", "tem_cd8", "mdsc", "treg"], "#correlations_table_ips");
    FillTable(response_data.spearman, ["chemokine_avg", "ccl2", "ccl3", "ccl4", "ccl5", "ccl8", "ccl18", "ccl19", "ccl21", "cxcl9", "cxcl10", "cxcl11", "cxcl13"], "#correlations_table_chemokine");
};

// Update nCNA vs ploidy
function Update_nCNA_Chart(response_data) {
    var trace1 = {
        x: response_data.filter(x => (x[1] < 2)).map(x => x[0]),
        y: response_data.filter(x => (x[1] < 2)).map(x => x[1]),
        mode: 'markers',
        type: 'scatter',
        name: "Ploidy<2",
        marker: { color: COLORS_5[0] },
    }
    var trace2 = {
        x: response_data.filter(x => (x[1] >= 2) && (x[1] < 3)).map(x => x[0]),
        y: response_data.filter(x => (x[1] >= 2) && (x[1] < 3)).map(x => x[1]),
        mode: 'markers',
        type: 'scatter',
        name: "2<=Ploidy<3",
        marker: { color: COLORS_5[1] },
    }
    var trace3 = {
        x: response_data.filter(x => (x[1] >= 3) && (x[1] < 4)).map(x => x[0]),
        y: response_data.filter(x => (x[1] >= 3) && (x[1] < 4)).map(x => x[1]),
        mode: 'markers',
        type: 'scatter',
        name: "3<=Ploidy<4",
        marker: { color: COLORS_5[2] },
    }
    var trace4 = {
        x: response_data.filter(x => (x[1] >= 4)).map(x => x[0]),
        y: response_data.filter(x => (x[1] >= 4)).map(x => x[1]),
        mode: 'markers',
        type: 'scatter',
        name: "Ploidy>=4",
        marker: { color: COLORS_5[3] },
    }
    var layout = {
        xaxis: { title: "Number of copies" },
        yaxis: { title: "Ploidy" },
        margin: {
            r: 20,
            t: 40
        },
        showlegend: false,
    };
    var data = [trace1, trace2, trace3, trace4];
    Plotly.newPlot("ncna_ploidy", data, layout, { responsive: true });
}

// Update the spearman values (correlation and pvalue) for a given ID
function Update_Spearman(id, spearmandata) {
    try {
        // Check for empty data
        if (spearmandata === undefined || spearmandata.correlation == null || spearmandata.pvalue == null) return;
        $("#cor_" + id).html("Correlation coefficient: " + spearmandata.correlation.toFixed(3));
        $("#pvalue_" + id).html("P-value: " + spearmandata.pvalue.toFixed(3));
    } catch {}
}

// Update the Wilcoxon values (pvalue) for a given ID
function Update_Wilcoxon(id, wilcoxondata) {
    try {
        // Check for empty data
        if (wilcoxondata === undefined || wilcoxondata.pvalue == null) return;
        $("#pvalue_" + id).html("P-value: " + wilcoxondata.pvalue.toFixed(3));
    } catch {}
}

function FillTable(spearman, columns, table_id) {
    var table_data = [];
    for (var key in spearman) {
        // Extract type and score from the key
        var index = key.indexOf('_');
        var type = key.substr(0, index);
        var score = key.substr(index + 1);
        // Check if the column is included
        if (!columns.includes(score)) continue;

        // Extract the value
        var value = spearman[key];
        // Skip nulls
        if (value == null || value.pvalue == null || value.correlation == null) continue;

        // Add to the table
        if (type == "bcs") {
            table_data.push({
                "genes": score,
                "bcs_pvalue": value.pvalue.toFixed(3),
                "bcs_cor": value.correlation.toFixed(3),
                "fcs_pvalue": 0,
                "fcs_cor": 0
            });
        } else if (type == "fcs") {
            var item = table_data.find(x => x.genes == score);
            item.fcs_pvalue = value.pvalue.toFixed(3);
            item.fcs_cor = value.correlation.toFixed(3);
        }
    }
    // Populate the data table
    $(table_id).bootstrapTable({ data: table_data });
}

// Update boxplots general
function UpdateBoxplotsGeneral() {
    // Ajax call to get all charts data
    $.ajax({
        method: "GET",
        url: "get_data_boxplot/",
        success: function (response_data) {
            function bp_update(div_id, data, title, sort = false) {
                var array_data = []
                for (key in data) array_data.push({ "key": key, "value": data[key].filter(x => x != null || !sort) })
                if (sort) array_data.sort((a, b) => Median(a.value) - Median(b.value))
                Update_BoxPlot(div_id, array_data.map(x => x.value), array_data.map(x => x.key), title, COLORS)
            }
            bp_update("box_general_BCS", response_data.data_bcs, "BCS", $('#tgl_bcs').is(':checked'))
            bp_update("box_general_FCS", response_data.data_fcs, "FCS", $('#tgl_fcs').is(':checked'))
            bp_update("box_general_MHC", response_data.data_mhc, "MHC", $('#tgl_mhc').is(':checked'))

            bp_update("box_general_CP", response_data.data_cp, "CP", $('#tgl_cp').is(':checked'))
            bp_update("box_general_EC", response_data.data_ec, "EC", $('#tgl_ec').is(':checked'))
            bp_update("box_general_SC", response_data.data_sc, "SC", $('#tgl_sc').is(':checked'))
            bp_update("box_general_stromal", response_data.data_stromal, "StromalScore", $('#tgl_estimate_stromal').is(':checked'))
            bp_update("box_general_immune", response_data.data_immune, "ImmuneScore", $('#tgl_estimate_immune').is(':checked'))
            bp_update("box_general_chemokine_avg", response_data.data_chemokine_avg, "Chemokine", $('#tgl_chemokine').is(':checked'))
        },
        error: function (data) {
            console.log("Error");
            console.log(data);
        }
    })
}

function UpdateCancerTypesFrequency() {
    $.ajax({
        method: "GET",
        url: "get_freq_types/",
        success: function (response_data) {
            DrawStackedBarGraph('cancerTypes', response_data.data, response_data.labels, response_data.labels_detail, COLORS)
            // Show number of cancer types
            //$('#cancer_types_count').html(` (${response_data.data.length})`);
        },
        error: function (data) {
            console.log("Error");
            console.log(data);
        }
    })
}

function Median(values) {
    if (values.length === 0) return 0;

    values.sort(function (a, b) {
        return a - b;
    });

    var half = Math.floor(values.length / 2);

    if (values.length % 2)
        return parseFloat(values[half]);

    return (parseFloat(values[half - 1]) + parseFloat(values[half])) / 2.0;
}
