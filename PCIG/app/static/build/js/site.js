
$(function () {
    // Enable pop-overs everywhere
    $('[data-toggle="popover"]').popover()
})

// Before changing tab
$('a[data-toggle="tab"]').on('show.bs.tab', function (e) {
    // Hide popovers
    $('[data-toggle="popover"]').popover('hide');
})
// After changing tab
$('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
    // Trigger resize event
    window.dispatchEvent(new Event('resize'));
})

// Event when the organ select changes
$('#organ').change(function () {
    // Empty cancer_type 
    $('#cancer_type').html('<option value="">Select cancer type</option>');
    // Get the selected organ
    var organ = $('#organ').val();
    // AJAX call to get_cancer_types
    $.ajax({
        method: "GET",
        url: "get_cancer_types/",
        data: {
            "organ": organ
        },
        success: function (response_data) {
            for (var i = 0; i < response_data.cancer_types.length; i++) {
                $('<option/>').val(response_data.cancer_types[i]).html(response_data.cancer_types[i]).appendTo('#cancer_type');
            }
        },
        error: function (data) {
            console.log("Error");
            console.log(data);
        }
    })
});


// Event when one of the 3 main filters changes
$('#organ, #cancer_type').change(function () {
    // Reset indel checkbox state
    $('#indels').prop('checked', false);
});

// Event when hte indels checkbox is clicked
$('#indels').click(Reload);

// Event when filters change 
$('#cancer_type, #hm_select_ips, #hm_select_cna').change(Reload);

// Function that realoads all the page data
function Reload() {
    // Remove warnings
    $('.alert-danger').remove();
    // Show overlay
    $("#overlay").show();

    // Get the selected values
    var cancer_type = $('#cancer_type').val();
    var indels = $('#indels').prop("checked");

    // Call the function to update counters
    UpdateCounters(cancer_type);

    if (cancer_type == '') {
        // If no cancer_type is chosen, show the main page
        $('#home_chart').show();
        $('#cancer_details_nav').hide();
        $('#btn-download').hide();
        $('#div-indels').hide();
        // Hide overlay
        $("#overlay").hide();
    } else {
        // Else, show the details page
        $('#home_chart').hide();
        $('#cancer_details_nav').show();
        $('#btn-download').show();
        $('#div-indels').show();
        // Update graphs
        Update_Charts(cancer_type, indels);
    }
}

// Event when the download button is clicked
$('#btn-download').click(function () {
    // Get the selected organ, cancer type 
    var organ = $('#organ').val();
    var cancer_type = $('#cancer_type').val();
    var indels = $('#indels').prop("checked");

    // Spinner button
    $('#btn-download-icon').removeClass('fa-download');
    $('#btn-download-icon').addClass('fa-spinner');
    $('#btn-download-icon').addClass('fa-spin');
    $('#btn-download').attr('disabled', 'disabled');

    // AJAX call to get_data_report
    $.ajax({
        method: "GET",
        url: "get_data_report/",
        data: {
            "organ": organ,
            "cancer_type": cancer_type,
            "indels": indels
        },
        success: function (response_data) {
            // Download the file
            download_file("PCIG_export.csv", response_data);
            // Spinner button
            $('#btn-download-icon').addClass('fa-download');
            $('#btn-download-icon').removeClass('fa-spinner');
            $('#btn-download-icon').removeClass('fa-spin');
            $('#btn-download').removeAttr('disabled');
        },
        error: function (data) {
            console.log("Error");
            console.log(data);
        }
    })
});

// Event when the download user guide button is clicked
$('#btn-user-guide').click(function () {
    // Spinner button
    $('#btn-user-guide-icon').removeClass('fa-question');
    $('#btn-user-guide-icon').addClass('fa-spinner');
    $('#btn-user-guide-icon').addClass('fa-spin');
    $('#btn-user-guide').attr('disabled', 'disabled');

    // AJAX call to get_user_guide
    $.ajax({
        method: "GET",
        url: "get_user_guide/",
        xhrFields: { responseType: "blob" },
        success: function (response_data) {
            // Download the file
            download_file("PCIG_user_guide.pdf", response_data);
            // Spinner button
            $('#btn-user-guide-icon').addClass('fa-download');
            $('#btn-user-guide-icon').removeClass('fa-spinner');
            $('#btn-user-guide-icon').removeClass('fa-spin');
            $('#btn-user-guide').removeAttr('disabled');
        },
        error: function (data) {
            console.log("Error");
            console.log(data);
        }
    })
});

function download_file(filename, data) {
    var blob = new Blob([data]);
    var link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}

// Event when scrolling the page
$('body').scroll(function () {
    // Hide popovers
    $('[data-toggle="popover"]').popover('hide');
    // When the user scrolls down 20px from the top of the document, show the 'go top' button
    if (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) {
        $('.btn-gotop').show();
    } else {
        $('.btn-gotop').hide();
    }
});

// When the user clicks on the 'go top' button, scroll to the top of the document
function topFunction() {
    document.body.scrollTop = 0; // For Safari
    document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
}

$('.toggle').change(function () {
    UpdateBoxplotsGeneral()
})

// Colors for the graphs
var COLORS = [
    '#FFD592', '#FFC05C', '#FFB238', '#E8A233', '#BA8229', '#E8A233', '#FFB94A', '#FFCE80',
    '#FFBDB3', '#FFA395', '#FF6F59', '#E86551', '#BA5141', '#E86551', '#FF8977', '#FFA395',
    '#EEAFAC', '#E47F7B', '#DB504A', '#C84944', '#B4423D', '#C84944', '#DE5F5A', '#E88F8B',
    '#ABE6DB', '#58CDB7', '#1ABB9C', '#18AA8E', '#169A80', '#18AA8E','#2EC1A5', '#6DD3C0',
    '#BEBCD7', '#8B87B7', '#726DA8', '#686499', '#686499', '#686499', '#7E7AAF', '#A5A2C7',
    '#A6B4C5', '#607897', '#4E698B', '#3D5A80', '#385275', '#4E698B', '#607897', '#A6B4C5', 

]
var COLORS_5 = ['#DB504A', '#1ABB9C', '#FF6F59', '#FFB238', '#726DA8'];
var COLORS_2 = [
    ['#726DA8', '#1ABB9C'],
    ['#DB504A', '#1ABB9C'],
    ['#FFB238', '#1ABB9C'],
    ['#FF6F59', '#1ABB9C']
]

