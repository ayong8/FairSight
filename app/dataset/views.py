from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from django.http import JsonResponse
from rest_framework.request import Request
from . import models
from django.http import HttpResponse
from django.core.files import File
from django.core.serializers.json import DjangoJSONEncoder
from decimal import Decimal
import os
from config.settings.base import STATIC_ROOT, ROOT_DIR, STATICFILES_DIRS
from decorator import decorator

from ..static.lib.rankSVM import RankSVM
from ..static.lib.gower_distance import gower_distances
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
from sklearn import svm
import json, simplejson

def open_dataset(file_path):
    entire_file_path = os.path.join(STATICFILES_DIRS[0], file_path)
    whole_dataset_df = pd.read_csv(open(entire_file_path, 'rU'))

    return whole_dataset_df

def get_selected_dataset(whole_dataset_df, selected_x, selected_y):
    selected_x_df = whole_dataset_df[selected_x]
    selected_y_col = whole_dataset_df[selected_y]
    idx_col = whole_dataset_df['idx']
    dataset_df = pd.concat([selected_x_df, selected_y_col, idx_col], axis=1)
    #dataset_df = dataset_df.set_index('idx')

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


class RunRankSVM(APIView):

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

        print(rank_svm.coef_)
        for idx, feature in enumerate(X.columns):
            weighted_X[feature] = X[feature] * rank_svm.coef_[0, idx]
        weighted_X['weighted_sum'] = weighted_X.sum(axis=1)

        # When we put the leader as 100, what's the weight, and what's the scores for the rest of them when being multiplied by the weight?
        weight_from_leader = 100 / weighted_X['weighted_sum'].max()
        min_max_scaler = preprocessing.MinMaxScaler()
        scaled_sum = min_max_scaler.fit_transform(weighted_X['weighted_sum'].values.reshape(-1, 1))
        weighted_X['score'] = scaled_sum * 100
        weighted_X = weighted_X.sort_values(by='score', ascending=False)
        print(weighted_X)

        weighted_X['ranking'] = range(1, len(weighted_X) + 1)
        print(weighted_X)

        return Response(weighted_X.to_json(orient='index'))

    def post(self, request, format=None):
        print('post data: ', request)
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

        # When we put the leader as 100, what's the weight, and what's the scores for the rest of them when being multiplied by the weight?
        weight_from_leader = 100 / weighted_X['weighted_sum'].max()
        min_max_scaler = preprocessing.MinMaxScaler()
        scaled_sum = min_max_scaler.fit_transform(weighted_X['weighted_sum'].values.reshape(-1, 1))
        weighted_X['score'] = scaled_sum * 100
        weighted_X = weighted_X.sort_values(by='score', ascending=False)
        print(weighted_X)

        weighted_X['ranking'] = range(1, len(weighted_X) + 1)
        print(weighted_X)

        return Response(weighted_X.to_json(orient='index'))

class RunSVM(APIView):

    def get(self, request, format=None):
        print('svm____fitt: ')
        whole_dataset_df = open_dataset('./data/german_credit_sample.csv')
        whole_dataset_df = do_encoding_categorical_vars(whole_dataset_df, 'sex')
        dataset_df = get_selected_dataset(whole_dataset_df, ['credit_amount', 'installment_as_income_perc', 'sex', 'age'], 'default')
        dataset_df = dataset_df.sort_values(by='idx', ascending=True)

        print('svm____fitttt: ')
        X = dataset_df[['credit_amount', 'installment_as_income_perc', 'sex', 'age']]
        y = dataset_df['default']
        idx_col = dataset_df['idx']

        print('svm____fittttttt: ')
        X_train, X_test, y_train, y_test = train_test_split(X.as_matrix(), y.as_matrix(), test_size=0.3)
        svm_fit = svm.SVC(probability=True, kernel='linear').fit(X_train, y_train)
        accuracy = svm_fit.score(X_test, y_test)
        pred_probs = svm_fit.predict_proba(X)

        print('predicted_probabilities: ', pred_probs)
        print('svm____fittttttttttttt: ', svm_fit)

        weighted_X = X.copy()
        weighted_X['idx'] = idx_col
        weighted_X['group'] = weighted_X['sex']

        # print(svm_fit.coef_);
        # for idx, feature in enumerate(X.columns):
        #     weighted_X[feature] = X[feature] * svm_fit.coef_[0, idx]
        # weighted_X['weighted_sum'] = weighted_X.sum(axis=1)

        # # When we put the leader as 100, what's the weight, and what's the scores for the rest of them when being multiplied by the weight?
        # weight_from_leader = 100 / weighted_X['weighted_sum'].max()
        # min_max_scaler = preprocessing.MinMaxScaler()
        # scaled_sum = min_max_scaler.fit_transform(weighted_X['weighted_sum'].values.reshape(-1, 1))
        # weighted_X['score'] = scaled_sum * 100
        # weighted_X = weighted_X.sort_values(by='score', ascending=False)
        # print(weighted_X)

        # weighted_X['ranking'] = range(1, len(weighted_X) + 1)
        # print(weighted_X)

        return Response(weighted_X.to_json(orient='index'))

    def post(self, request, format=None):
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

        # When we put the leader as 100, what's the weight, and what's the scores for the rest of them when being multiplied by the weight?
        weight_from_leader = 100 / weighted_X['weighted_sum'].max()
        min_max_scaler = preprocessing.MinMaxScaler()
        scaled_sum = min_max_scaler.fit_transform(weighted_X['weighted_sum'].values.reshape(-1, 1))
        weighted_X['score'] = scaled_sum * 100
        weighted_X = weighted_X.sort_values(by='score', ascending=False)
        weighted_X['ranking'] = range(1, len(weighted_X) + 1)

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

        df_mds_result = pd.DataFrame(MDS(n_components=2, metric=False, random_state=3).fit_transform(d), dataset_mds.index)
        df_mds_result['idx'] = dataset_df['idx']
        df_mds_result['group'] = dataset_df['sex']
        df_mds_result['default'] = dataset_df['default']
        df_mds_result.columns = ['dim1', 'dim2', 'idx', 'group', 'default']
        

        return Response(df_mds_result.to_json(orient='index'))

# Calculate pairwise gower distance for mixed type of variables
class CalculatePairwiseInputDistance(APIView):
    
    def get(self, request, format=None):
        whole_dataset_df = open_dataset('./data/german_credit_sample.csv')
        whole_dataset_df = do_encoding_categorical_vars(whole_dataset_df, 'sex')
        dataset_df = get_selected_dataset(whole_dataset_df, ['credit_amount', 'installment_as_income_perc', 'sex', 'age'], 'default')
        dataset_gower_distance = pd.DataFrame(dataset_df[['credit_amount', 'installment_as_income_perc', 'sex', 'age']])
        dataset_gower_distance = dataset_gower_distance.set_index(dataset_df['idx'])

        print(dataset_gower_distance)
        dataset_gower_distance['credit_amount'] = dataset_gower_distance['credit_amount'].astype(float)
        dataset_gower_distance['installment_as_income_perc'] = dataset_gower_distance['installment_as_income_perc'].astype(float)
        dataset_gower_distance['sex'] = dataset_gower_distance['sex'].astype(float)
        dataset_gower_distance['age'] = dataset_gower_distance['age'].astype(float)

        X=pd.DataFrame({'age':[21,21,19, 30,21,21,19,30,None],
                        'gender':['M','M','N','M','F','F','F','F',None],
                        'civil_status':['MARRIED','SINGLE','SINGLE','SINGLE','MARRIED','SINGLE','WIDOW','DIVORCED',None],
                        'salary':[3000.0,1200.0 ,32000.0,1800.0 ,2900.0 ,1100.0 ,10000.0,1500.0,None],
                        'has_children':[1,0,1,1,1,0,0,1,None],
                        'available_credit':[2200,100,22000,1100,2000,100,6000,2200,None]})
        
        pairwise_distances = gower_distances(dataset_gower_distance)
        result = gower_distances(X)

        # Convert 2d array to a list of pairwise dictionaries
        # Index starting from 1
        pairwise_distances_list = []
        permutation_distances_list = []
        for i in range(pairwise_distances.shape[0]):
            for j in range(pairwise_distances.shape[1]):
                permutation_distances_list.append({
                        'idx1': i+1,
                        'idx2': j+1,
                        'input_dist': np.asscalar(pairwise_distances[i][j])
                    })

                if(i < j):  # Gather combinations (not permutations)
                    pairwise_distances_list.append({
                        'idx1': i+1,
                        'idx2': j+1,
                        'input_dist': np.asscalar(pairwise_distances[i][j])
                    })

        json_combined = simplejson.dumps({'pairwiseDistances': pairwise_distances_list, 'permutationDistances': permutation_distances_list})

        return Response(json_combined)

class CalculatePredictionIntervalandOutliers(APIView):
    
    def post(self, request, format=None):
        inputs = self.request.body
        print(inputs)