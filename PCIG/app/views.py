from django.shortcuts import render
from django.template import loader
from django.http import HttpResponse
from django.http import JsonResponse
from django.core.files import File
from app import database
from pcig.settings import MEDIA_ROOT
import collections
import json
import simplejson
import os
import mimetypes

# Load index
def index(request):
    context = {
        "organs": database.get_organs()
    }
    template = loader.get_template('app/index.html')
    return HttpResponse(template.render(context, request))

# Load any other view
# All resource paths end in .html
def any_html(request):
    context = {}
    # Pick out the html file name from the url. And load that template.
    load_template = request.path.split('/')[-1]
    template = loader.get_template('app/' + load_template)
    return HttpResponse(template.render(context, request))


# AJAX calls

# Get frequency of cancer types
def get_freq_types(request):
    result = database.get_data_freq_cancer()
    return JsonResponse(result)

# Get cancer_types for filter
def get_cancer_types(request):
    result = database.get_cancer_types(request.GET['organ'])
    return JsonResponse(result)

# Get data for the header counters
def get_data_counters(request):
    result = database.get_data_counters(request.GET['cancer_type'])
    return JsonResponse(result)

# Get data for all the charts
def get_charts_data(request):
    # Get the parameters from the request
    cancer_type = request.GET['cancer_type']
    indels = request.GET['indels'] == 'true'

    # Get requested data from the database
    # Get data for IPS and CNA scores
    data_scores = database.get_data_scores(cancer_type, indels)
    # Get data for SV effects
    sv_effect = database.get_data_sv_effect(cancer_type)
    # Get data for number of CNAs
    cna = database.get_data_cna(cancer_type)
    # Get data for CTH
    cth = database.get_data_cth(request.GET['cancer_type'])
    # Get q6-HLA del data
    hla_del = database.get_data_HLA(request.GET['cancer_type'])

    result = {
        "data_scores": data_scores,
        "sv_effect": sv_effect,
        "cna": cna,
        "cth": cth,
        "hla_del": hla_del,
    }

    # Remove NaN
    result = simplejson.dumps(result, ignore_nan=True)
    result = json.loads(result)
    return JsonResponse(result, safe=False)

# Get data for report
def get_data_report(request):
    # Get the CSV file
    csv = database.get_data_report(request.GET['cancer_type'], request.GET['indels'] == 'true')
    # Return response with download
    with open(os.path.abspath(csv.name), 'rb') as fh:
        response = HttpResponse(fh.read(), content_type="application/vnd.ms-excel")
        response['Content-Disposition'] = 'inline; filename=' + csv.name
        return response

# Get data acroos all cancer for boxplots
def get_data_boxplot(request):
    result = database.get_data_boxplot()
    return JsonResponse(result)

# Download user guide
def get_user_guide(request):
    filename = "PCIG_user_guide.pdf"
    path = f'{MEDIA_ROOT}/{filename}'
    with open(path, 'rb') as file:
        mime_type, _ = mimetypes.guess_type(path)
        response = HttpResponse(file, content_type=mime_type)
        response['Content-Disposition'] = f'attachment; filename={filename}'
        response['Content-Length'] = os.path.getsize(path)
        return response
