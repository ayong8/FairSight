from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.request import Request
from . import models
from django.http import HttpResponse
from django.core.files import File
import os
from config.settings.base import STATIC_ROOT, ROOT_DIR, STATICFILES_DIRS
from decorator import decorator

from ..static.lib.rankSVM import RankSVM
#from ..static.lib.rankSVM2 import RankSVM
from io import StringIO
import csv
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics.pairwise import pairwise_distances
from sklearn.manifold import MDS
from sklearn.preprocessing import Imputer
from sklearn import preprocessing
import json

def open_dataset(file_path):
    entire_file_path = os.path.join(STATICFILES_DIRS[0], file_path)
    whole_dataset_df = pd.read_csv(open(entire_file_path, 'rU'))

    return whole_dataset_df

def get_selected_dataset(whole_dataset_df, selected_x, selected_y):
    selected_x_df = whole_dataset_df[selected_x]
    selected_y_col = whole_dataset_df[selected_y]
    idx_col = whole_dataset_df['idx']
    dataset_df = pd.concat([selected_x_df, selected_y_col, idx_col], axis=1)

    return dataset_df

def do_encoding_categorical_vars(whole_dataset_df, categorical_var):
    # Figure out all categories in a feature
    categories = whole_dataset_df[categorical_var].unique()
    
    # Identify sensitive attribute, and the rest... then assign integer
    sensitive_attr = 'female'
    another_attr = 'male'

    # Replace categorical values with integers
    whole_dataset_df['sex'] = np.where(whole_dataset_df['sex']=='female', 2, 1)
    group_col = np.copy(whole_dataset_df['sex'])

    return whole_dataset_df


class LoadFile(APIView):
    def get(self, request, format=None):
        whole_dataset_df = open_dataset('./data/german_credit_sample.csv')

        return Response(whole_dataset_df.to_json(orient='index'))


class GetSelectedDataset(APIView):

    def get(self, request, format=None):
        whole_dataset_df = open_dataset('./data/german_credit_sample.csv')
        whole_dataset_df = do_encoding_categorical_vars(whole_dataset_df, 'sex')
        dataset_df = get_selected_dataset(whole_dataset_df, ['credit_amount', 'installment_as_income_perc', 'sex', 'age'], 'default')

        return Response(dataset_df.to_json(orient='index'))


class RunModel(APIView):

    def get(self, request, format=None):
        whole_dataset_df = open_dataset('./data/german_credit_sample.csv')
        whole_dataset_df = do_encoding_categorical_vars(whole_dataset_df, 'sex')
        dataset_df = get_selected_dataset(whole_dataset_df, ['credit_amount', 'installment_as_income_perc', 'sex', 'age'], 'default')
        dataset_df = dataset_df.sort_values(by='idx', ascending=True)

        X = dataset_df[['credit_amount', 'installment_as_income_perc', 'sex', 'age']]
        y = dataset_df['default']
        idx_col = dataset_df['idx']

        X_train, X_test, y_train, y_test = train_test_split(X.as_matrix(), y.as_matrix(), test_size=0.3)
        rank_svm = RankSVM().fit(X_train, y_train)
        accuracy = rank_svm.score(X_test, y_test)

        weighted_X = X.copy()
        weighted_X['idx'] = idx_col
        weighted_X['group'] = weighted_X['sex']

        print(rank_svm.coef_);
        for idx, feature in enumerate(X.columns):
            weighted_X[feature] = X[feature] * rank_svm.coef_[0, idx]
        weighted_X['weighted_sum'] = weighted_X.sum(axis=1)

        print(weighted_X)
        # When we put the leader as 100, what's the weight, and what's the scores for the rest of them when being multiplied by the weight?
        weight_from_leader = 100 / weighted_X['weighted_sum'].max()
        min_max_scaler = preprocessing.MinMaxScaler()
        scaled_sum = min_max_scaler.fit_transform(weighted_X['weighted_sum'].values.reshape(-1, 1))
        weighted_X['score'] = scaled_sum * 100
        weighted_X = weighted_X.sort_values(by='score', ascending=False).sort_index(level=0, ascending=[False])
        print(weighted_X)

        ranking_list = []
        for idx, row in weighted_X.iterrows():
            ranking_list.append(idx + 1)
        weighted_X['ranking'] = ranking_list

        return Response(weighted_X.to_json(orient='index'))

class GetWeight(APIView):
    
    def get(self, request, format=None):
        whole_dataset_df = open_dataset('./data/german_credit_sample.csv')
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

        return Response(weight_df.to_json(orient='index'))

class GetWeightedDataset(APIView):
    
    def get(self, request, format=None):
        whole_dataset_df = open_dataset('./data/german_credit_sample.csv')
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

        return Response(weighted_dataset_df)


class SetSensitiveAttr(APIView):

    def post(self, request, format=None):
        sensitiveAttr = self.request.body


class RunMDS(APIView):

    def get(self, request, format=None):
        whole_dataset_df = open_dataset('./data/german_credit_sample.csv')
        whole_dataset_df = do_encoding_categorical_vars(whole_dataset_df, 'sex')
        dataset_df = get_selected_dataset(whole_dataset_df, ['credit_amount', 'installment_as_income_perc', 'sex', 'age'], 'default')
        dataset_mds = pd.DataFrame(dataset_df[['credit_amount', 'installment_as_income_perc', 'sex', 'age']])

        d = pairwise_distances(dataset_mds)

        df_mds_result = pd.DataFrame(MDS(n_components=2, metric=False).fit_transform(d), dataset_mds.index)
        df_mds_result['idx'] = dataset_df['idx']
        df_mds_result['group'] = dataset_df['sex']
        df_mds_result['default'] = dataset_df['default']
        df_mds_result.columns = ['dim1', 'dim2', 'idx', 'group', 'default']

        return Response(df_mds_result.to_json(orient='index'))