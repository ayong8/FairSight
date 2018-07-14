from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.request import Request
from . import models
from django.http import HttpResponse
from django.core.files import File
import os
from config.settings.base import STATIC_ROOT, ROOT_DIR, STATICFILES_DIRS

from ..static.lib.rankSVM import RankSVM
from io import StringIO
import csv
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics.pairwise import pairwise_distances
from sklearn.manifold import MDS
from sklearn.preprocessing import Imputer


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
        file_path = os.path.join(STATICFILES_DIRS[0], './data/german_credit_sample.csv')
        
        df1 = pd.read_csv(open(file_path, 'rU'))
        dataset = df1[['default', 'credit_amount', 'installment_as_income_perc', 'sex', 'age']]

        train_set, test_set = train_test_split(dataset)
        #rank_svm = RankSVM().fit(train_set['credit_amount'], train_set['default'])
        #rank_svm.score(test_set['credit_amount'], test_set['credit_amount'])

        return Response("1")

class RunMDS(APIView):

    def get(self, request, format=None):
        file_path = os.path.join(STATICFILES_DIRS[0], './data/german_credit_sample.csv')
        
        df1 = pd.read_csv(open(file_path, 'rU'), index_col=0) # 0 = 'id' column
        dataset = df1[['default', 'credit_amount', 'installment_as_income_perc', 'sex', 'age']]
        dataset_mds = pd.DataFrame(dataset[['credit_amount', 'installment_as_income_perc', 'age']])
        

        # should do normalization

        # calculate pairwise distance
        #dataset_mds = dataset_mds.transpose()
        d = pairwise_distances(dataset_mds)

        df_mds_result = pd.DataFrame(MDS(n_components=2, metric=False).fit_transform(d), dataset_mds.index)
        df_mds_result['sex'] = dataset['sex']
        df_mds_result['default'] = dataset['default']
        df_mds_result.columns = ['dim1', 'dim2', 'sex', 'default']
        print(df_mds_result)

        return Response(df_mds_result.to_json(orient='index'))