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
import json




class LoadFile(APIView):

    # get method
    def get(self, request, format=None):
        # Create the HttpResponse object with the appropriate CSV header.
        file_path = os.path.join(STATICFILES_DIRS[0], './data/german_credit_sample.csv')
        
        whole_dataset_df = pd.read_csv(open(file_path, 'rU'))



        return Response(whole_dataset_df.to_json(orient='index'))

class RunModel(APIView):

    # get method
    def get(self, request, format=None):
        file_path = os.path.join(STATICFILES_DIRS[0], './data/german_credit_sample.csv')
        
        whole_dataset_df = pd.read_csv(open(file_path, 'rU'))
        X = whole_dataset_df[['credit_amount', 'installment_as_income_perc', 'sex', 'age']].as_matrix()
        y = whole_dataset_df[['default']].as_matrix()

        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3)
        rank_svm = RankSVM().fit(X_train, y_train)
        scores = rank_svm.score(X_test['credit_amount'], y_test['credit_amount'])

        print(scores)

        whole_dataset_df = pd.read_csv(open('./german_credit_sample.csv', 'rU'))
        whole_dataset_df['sex'] = pd.factorize(whole_dataset_df['sex'])[0]
        dataset_df = whole_dataset_df[['credit_amount', 'installment_as_income_perc', 'sex', 'age', 'default']]
        X = whole_dataset_df[['credit_amount', 'installment_as_income_perc', 'sex', 'age']]
        y = whole_dataset_df['default']

        X_train, X_test, y_train, y_test = train_test_split(X.as_matrix(), y.as_matrix(), test_size=0.3)

        rank_svm = RankSVM().fit(X_train, y_train)
        scores = rank_svm.score(X_test, y_test)

        weight_multiply_X = X.copy()
        coef_idx = 0

        for feature in X.columns:
            weight_multiply_X[feature] = X[feature] * rank_svm.coef_[0, coef_idx]
            coef_idx += 1

        return Response(df)

class GetWeight(APIView):
    
    def get(self, request, format=None):
        file_path = os.path.join(STATICFILES_DIRS[0], './data/german_credit_sample.csv')
        whole_dataset_df = pd.read_csv(open(file_path, 'rU'))
        whole_dataset_df['sex'] = pd.factorize(whole_dataset_df['sex'])[0]
        dataset_df = whole_dataset_df[['credit_amount', 'installment_as_income_perc', 'sex', 'age', 'default']]
        X = whole_dataset_df[['credit_amount', 'installment_as_income_perc', 'sex', 'age']]
        y = whole_dataset_df['default']

        X_train, X_test, y_train, y_test = train_test_split(X.as_matrix(), y.as_matrix(), test_size=0.3)

        rank_svm = RankSVM().fit(X_train, y_train)
        scores = rank_svm.score(X_test, y_test)
        weight_dict = {}

        for idx, feature in enumerate(X.columns):
            weight_dict[feature] = [ rank_svm.coef_[0, idx] ]

        weight_df = pd.DataFrame(weight_dict, columns=X.columns)

        coef_idx = 0
        # Multiplied weights to each data point
        # for feature in X.columns:
        #     weight_df[feature] = X[feature] * rank_svm.coef_[0, coef_idx]
        #     coef_idx += 1

        # print('weight_df: ', weight_df)

        return Response(weight_df)

class GetWeightedDataset(APIView):
    
    def get(self, request, format=None):
        file_path = os.path.join(STATICFILES_DIRS[0], './data/german_credit_sample.csv')
        whole_dataset_df = pd.read_csv(open(file_path, 'rU'))
        whole_dataset_df['sex'] = pd.factorize(whole_dataset_df['sex'])[0]
        dataset_df = whole_dataset_df[['credit_amount', 'installment_as_income_perc', 'sex', 'age', 'default']]
        X = whole_dataset_df[['credit_amount', 'installment_as_income_perc', 'sex', 'age']]
        y = whole_dataset_df['default']

        X_train, X_test, y_train, y_test = train_test_split(X.as_matrix(), y.as_matrix(), test_size=0.3)

        rank_svm = RankSVM().fit(X_train, y_train)
        scores = rank_svm.score(X_test, y_test)

        weighted_dataset_df = pd.DataFrame(dataset_df, columns=X.columns)

        coef_idx = 0
        # Multiplied each data point by weight
        for feature in X.columns:
            weighted_dataset_df[feature] = X[feature] * rank_svm.coef_[0, coef_idx]
            coef_idx += 1

        print('weighted_dataset_df: ', weighted_dataset_df)

        return Response(weighted_dataset_df)

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