from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from . import models, serializers
from django.http import HttpResponse
import csv


# Create your views here.

class LoadFile(request):
    # Create the HttpResponse object with the appropriate CSV header.
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="german_credit_sample.csv"'

    writer = csv.writer(response)
    writer.writerow(['First row', 'Foo', 'Bar', 'Baz'])
    writer.writerow(['Second row', 'A', 'B', 'C', '"Testing"', "Here's a quote"])

    return response

