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
from pandas.io.json import json_normalize
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics.pairwise import pairwise_distances
from sklearn.manifold import MDS
from sklearn.preprocessing import Imputer
from sklearn import preprocessing
from sklearn import svm

import numpy as np
import statsmodels.api as sm
from scipy import stats
import math

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
        dataset_df = get_selected_dataset(whole_dataset_df, ['credit_amount', 'income_perc', 'sex', 'age'], 'default')

        return Response(dataset_df.to_json(orient='index'))


class RunRankSVM(APIView):

    def get(self, request, format=None):
        pass

    def post(self, request, format=None):
        json_request = json.loads(request.body.decode(encoding='UTF-8'));
        whole_dataset_df = open_dataset('./data/german_credit_sample.csv')
        whole_dataset_df = do_encoding_categorical_vars(whole_dataset_df, json_request['sensitiveAttr'])
        dataset_df = get_selected_dataset(whole_dataset_df, json_request['features'], json_request['target'])
        dataset_df = dataset_df.sort_values(by='idx', ascending=True)

        X = dataset_df[ json_request['features'] ]
        y = dataset_df[ json_request['target'] ]
        idx_col = dataset_df['idx']

        X_train, X_test, y_train, y_test = train_test_split(X.as_matrix(), y.as_matrix(), test_size=0.3, random_state=42)
        rank_svm = RankSVM().fit(X_train, y_train)
        accuracy = rank_svm.score(X_test, y_test)

        output_df = X.copy()
        output_df['idx'] = idx_col
        output_df['group'] = whole_dataset_df[ json_request['sensitiveAttr'] ]
        output_df['target'] = y

        print('coeffs: ', rank_svm.coef_)
        weighted_X_df = X.copy()
        for idx, feature in enumerate(X.columns):
            weighted_X_df[feature] = X[feature] * rank_svm.coef_[0, idx]
        output_df['weighted_sum'] = weighted_X_df.sum(axis=1)

        # When we put the leader as 100, what's the weight, and what's the scores for the rest of them when being multiplied by the weight?
        weight_from_leader = 100 / output_df['weighted_sum'].max()
        min_max_scaler = preprocessing.MinMaxScaler()
        scaled_sum = min_max_scaler.fit_transform(output_df['weighted_sum'].values.reshape(-1, 1))
        output_df['score'] = scaled_sum * 100

        # Add rankings
        output_df = output_df.sort_values(by='score', ascending=False)
        output_df['ranking'] = range(1, len(output_df) + 1)

        # Convert to dict and put all features into 'features' key
        instances_dict_list = list(output_df.T.to_dict().values())
        for output_item in instances_dict_list:  # Go over all items
            features_dict = {}
            for feature_key in json_request['features']:
                features_dict[ feature_key ] = output_item[ feature_key ]
                output_item.pop(feature_key, None)
            output_item['features'] = features_dict

        ranking_instance_dict = {
            'rankingId': json_request['rankingId'],
            'features': json_request['features'],
            'target': json_request['target'],
            'sensitiveAttr': json_request['sensitiveAttr'],
            'method': json_request['method'],
            'stat': { 'accuracy': math.ceil(accuracy * 100) / 100.0 },
            'instances': instances_dict_list
        }

        return Response(json.dumps(ranking_instance_dict))

class RunSVM(APIView):

    def get(self, request, format=None):
        whole_dataset_df = open_dataset('./data/german_credit_sample.csv')
        whole_dataset_df = do_encoding_categorical_vars(whole_dataset_df, 'sex')
        dataset_df = get_selected_dataset(whole_dataset_df, ['credit_amount', 'income_perc', 'sex', 'age'], 'default')
        dataset_df = dataset_df.sort_values(by='idx', ascending=True)

        X = dataset_df[['credit_amount', 'income_perc', 'sex', 'age']]
        y = dataset_df['default']
        idx_col = dataset_df['idx']

        X_train, X_test, y_train, y_test = train_test_split(X.as_matrix(), y.as_matrix(), test_size=0.3)
        svm_fit = svm.SVC(probability=True, kernel='linear', random_state=0).fit(X_train, y_train)
        accuracy = svm_fit.score(X_test, y_test)
        pred_probs = svm_fit.predict_proba(X)

        print('svm coef: ', svm_fit.coef_)

        weighted_X = X.copy()
        weighted_X['idx'] = idx_col
        weighted_X['group'] = weighted_X['sex']

        return Response(weighted_X.to_json(orient='index'))

    def post(self, request, format=None):
        whole_dataset_df = open_dataset('./data/german_credit_sample.csv')
        whole_dataset_df = do_encoding_categorical_vars(whole_dataset_df, 'sex')
        dataset_df = get_selected_dataset(whole_dataset_df, ['credit_amount', 'income_perc', 'sex', 'age'], 'default')
        dataset_df = dataset_df.sort_values(by='idx', ascending=True)

        X = dataset_df[['credit_amount', 'income_perc', 'sex', 'age']]
        y = dataset_df['default']
        idx_col = dataset_df['idx']

        X_train, X_test, y_train, y_test = train_test_split(X.as_matrix(), y.as_matrix(), test_size=0.3, random_state=0)
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
        
        dataset_df = whole_dataset_df[['credit_amount', 'income_perc', 'sex', 'age', 'default']]
        X = whole_dataset_df[['credit_amount', 'income_perc', 'sex', 'age']]
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
        dataset_df = whole_dataset_df[['credit_amount', 'income_perc', 'sex', 'age', 'default']]
        X = whole_dataset_df[['credit_amount', 'income_perc', 'sex', 'age']]
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
        dataset_df = get_selected_dataset(whole_dataset_df, ['credit_amount', 'income_perc', 'sex', 'age'], 'default')
        dataset_mds = pd.DataFrame(dataset_df[['credit_amount', 'income_perc', 'sex', 'age']])

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
        pass

    def post(self, request, format=None):
        json_request = json.loads(request.body.decode(encoding='UTF-8'))

        whole_dataset_df = open_dataset('./data/german_credit_sample.csv')
        whole_dataset_df = do_encoding_categorical_vars(whole_dataset_df, json_request['sensitiveAttr'])
        dataset_df = get_selected_dataset(whole_dataset_df, json_request['features'], json_request['target'])
        dataset_gower_distance = pd.DataFrame(dataset_df[ json_request['features'] ])
        dataset_gower_distance = dataset_gower_distance.set_index(dataset_df['idx'])

        for feature in json_request['features']:
            dataset_gower_distance[ feature ] = dataset_gower_distance[ feature ].astype(float)
        
        pairwise_distances = gower_distances(dataset_gower_distance)

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

# Get the confidence interval of slope to measure the fair area
class CalculateConfidenceInterval(APIView):

    def get(self, request, format=None):
        pass
    
    def post(self, request, format=None):
        json_request = json.loads(request.body.decode(encoding='UTF-8'))

        reg_df = json_normalize(json_request)
        idx1 = reg_df['idx1']
        idx2 = reg_df['idx2']
        X = reg_df['X']
        y = reg_df['y']
        y_hat = reg_df['yHat']

        y_err = y - y_hat
        mean_x = X.mean()
        n = len(X)
        dof = n - 1
        t = stats.t.ppf(1-0.025, df=dof)
        s_err = np.sum(np.power(y_err, 2))

        conf_interval = t * np.sqrt((s_err/(n-2))*(1.0/n + (np.power((X-mean_x),2) / ((np.sum(np.power(X,2))) - n*(np.power(mean_x,2))))))
        upper = y_hat + 2*abs(conf_interval)
        lower = y_hat - 2*abs(conf_interval)
        isFair = np.zeros(reg_df.shape[0]) # 0: false (unfair), 1: true (fair)
        isUpper = np.ones(reg_df.shape[0])
        isLower = np.zeros(reg_df.shape[0])

        conf_interval_points_upper_lower_df = pd.DataFrame({ 'x': X, 'upper': upper, 'lower': lower, 'idx1': idx1, 'idx2': idx2, 'distortion': y, 'isFair': isFair })
        for idx, pair in conf_interval_points_upper_lower_df.iterrows():
            if (pair['distortion'] <= pair['upper']) and (pair['distortion'] >= pair['lower']):
                conf_interval_points_upper_lower_df.loc[idx, 'isFair'] = 1

        conf_interval_points_upper_df = pd.DataFrame({ 'x': X, 'y': upper, 'isUpper': isUpper, 'idx1': idx1, 'idx2': idx2, 'distortion': y, 'isFair': conf_interval_points_upper_lower_df['isFair'] })
        conf_interval_points_upper_df = conf_interval_points_upper_df.sort_values(by='x', ascending=True)
        conf_interval_points_lower_df = pd.DataFrame({ 'x': X, 'y': lower, 'isUpper': isLower, 'idx1': idx1, 'idx2': idx2, 'distortion': y, 'isFair': conf_interval_points_upper_lower_df['isFair'] })
        conf_interval_points_lower_df = conf_interval_points_lower_df.sort_values(by='x', ascending=True)
        conf_interval_points_df = pd.concat([conf_interval_points_upper_df, conf_interval_points_lower_df], axis=0)
        conf_interval_points_df = conf_interval_points_df.sort_values(by=['idx1', 'idx2'])
        print(conf_interval_points_upper_df.loc[:20])

        return Response(conf_interval_points_df.to_json(orient='records'))