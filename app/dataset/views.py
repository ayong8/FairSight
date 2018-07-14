from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.request import Request
from . import models
from django.http import HttpResponse

from ..static.lib.rankSVM import RankSVM
import csv
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split


# Create your views here.

class LoadFile(APIView):

    # get method
    def get(self, request, format=None):
        # Create the HttpResponse object with the appropriate CSV header.
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="german_credit_sample.csv"'

        writer = csv.writer(response)
        writer.writerow(['First row', 'Foo', 'Bar', 'Baz'])
        writer.writerow(['Second row', 'A', 'B', 'C', '"Testing"', "Here's a quote"])

        return response

class RunModel(APIView):

    # get method
    def get(self, request, format=None):
        # Create the HttpResponse object with the appropriate CSV header.
        response = 1

        # Create the HttpResponse object with the appropriate CSV header.
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="german_credit_sample.csv"'
        print(response)

        return Response(response)
