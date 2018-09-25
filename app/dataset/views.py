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

numerical_features = ['duration_in_month', 'credit_amount', 'age', 'idx']

def open_dataset(file_path):
    entire_file_path = os.path.join(STATICFILES_DIRS[0], file_path)
    whole_dataset_df = pd.read_csv(open(entire_file_path, 'rU'))

    return whole_dataset_df

def get_selected_dataset(whole_dataset_df, selected_x, selected_y, selected_sensitive_attr):
    print('selected_x: ', selected_x)
    print(whole_dataset_df)
    selected_x_df = whole_dataset_df[selected_x]
    selected_y_col = whole_dataset_df[selected_y]
    selected_sensitive_attr_col = whole_dataset_df[selected_sensitive_attr]
    idx_col = whole_dataset_df['idx']
    dataset_df = pd.concat([selected_x_df, selected_y_col, selected_sensitive_attr_col, idx_col], axis=1)

    return dataset_df

def do_encoding_categorical_vars(whole_dataset_df):
    dataset_df = whole_dataset_df.copy()

    for feature in dataset_df:
        if feature not in numerical_features:
            dataset_df[feature] = pd.Categorical(dataset_df[feature])
            categories = dataset_df[feature].cat.categories
            dataset_df[feature] = dataset_df[feature].cat.codes

    return dataset_df

class LoadFile(APIView):
    def get(self, request, format=None):
        whole_dataset_df = open_dataset('./data/german_credit_sample.csv')

        return Response(whole_dataset_df.to_json(orient='index'))

class ExtractFeatures(APIView):
    def get(self, request, format=None):
        whole_dataset_df = open_dataset('./data/german_credit_sample.csv')
        dataset_df = whole_dataset_df.copy()
        dataset_df = dataset_df.drop('idx', axis=1)
        feature_info_list = []

        for feature in dataset_df:
            feature_info = {}
            if feature not in numerical_features:
                dataset_df[feature] = pd.Categorical(dataset_df[feature])
                categories = dataset_df[feature].cat.categories
                dataset_df[feature] = dataset_df[feature].cat.codes
                feature_info = { 'name': feature, 'type': 'categorical', 'range': list(categories) }
            else:
                feature_info = { 'name': feature, 'type': 'continuous', 'range': 'continuous' }
            
            feature_info_list.append(feature_info)

        return Response(json.dumps(feature_info_list))

class RunRankSVM(APIView):

    def get(self, request, format=None):
        pass

    def post(self, request, format=None):
        json_request = json.loads(request.body.decode(encoding='UTF-8'))
        
        features = json_request['features']
        target = json_request['target']
        sensitive_attr = json_request['sensitiveAttr']
        method = json_request['method']

        feature_names = [ feature['name'] for feature in features ]
        target_name = target['name']
        sensitive_attr_name = sensitive_attr['name']

        whole_dataset_df = open_dataset('./data/german_credit_sample.csv')
        dataset_df = do_encoding_categorical_vars(whole_dataset_df)
        dataset_df = get_selected_dataset(dataset_df, feature_names, target_name, sensitive_attr_name)
        dataset_df = dataset_df.sort_values(by='idx', ascending=True)

        X = dataset_df[ feature_names ]
        y = dataset_df[ target_name ]
        idx_col = dataset_df['idx']

        X_train, X_test, y_train, y_test = train_test_split(X.as_matrix(), y.as_matrix(), test_size=0.3, random_state=42)
        rank_svm = RankSVM().fit(X_train, y_train)
        accuracy = rank_svm.score(X_test, y_test)

        output_df = X.copy()
        output_df['idx'] = idx_col
        output_df['group'] = whole_dataset_df[ sensitive_attr_name ]
        output_df['target'] = y

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
            for feature_key in feature_names:
                features_dict[ feature_key ] = output_item[ feature_key ]
                output_item.pop(feature_key, None)
            output_item['features'] = features_dict

        ranking_instance_dict = {
            'rankingId': json_request['rankingId'],
            'features': features,
            'target': target,
            'sensitiveAttr': sensitive_attr,
            'method': method,
            'stat': { 'accuracy': math.ceil(accuracy * 100) },
            'instances': instances_dict_list
        }

        return Response(json.dumps(ranking_instance_dict))

class RunSVM(APIView):

    def get(self, request, format=None):
        pass

    def post(self, request, format=None):
        json_request = json.loads(request.body.decode(encoding='UTF-8'))

        features = json_request['features']
        target = json_request['target']
        sensitive_attr = json_request['sensitiveAttr']
        method = json_request['method']

        feature_names = [ feature['name'] for feature in features ]
        target_name = target['name']
        sensitive_attr_name = sensitive_attr['name']

        whole_dataset_df = open_dataset('./data/german_credit_sample.csv')
        dataset_df = do_encoding_categorical_vars(whole_dataset_df)
        dataset_df = get_selected_dataset(dataset_df, feature_names, target_name, sensitive_attr_name)
        dataset_df = dataset_df.sort_values(by='idx', ascending=True)

        X = dataset_df[ feature_names ]
        y = dataset_df[ target_name ]
        idx_col = dataset_df['idx']

        X_train, X_test, y_train, y_test = train_test_split(X.as_matrix(), y.as_matrix(), test_size=0.3)
        svm_fit = svm.SVC(kernel='linear', random_state=0, cache_size=7000).fit(X_train, y_train)
        accuracy = svm_fit.score(X_test, y_test)
        # pred_probs = svm_fit.predict_proba(X)

        output_df = X.copy()
        output_df['idx'] = idx_col
        output_df['group'] = whole_dataset_df[ sensitive_attr_name ]
        output_df['target'] = y

        weighted_X_df = X.copy()
        for idx, feature in enumerate(X.columns):
            weighted_X_df[feature] = X[feature] * svm_fit.coef_[0, idx]
        output_df['weighted_sum'] = weighted_X_df.sum(axis=1)

        # When we put the leader as 100, what's the weight, and what's the scores for the rest of them when being multiplied by the weight?
        weight_from_leader = 100 / output_df['weighted_sum'].max()
        min_max_scaler = preprocessing.MinMaxScaler()
        scaled_sum = min_max_scaler.fit_transform(output_df['weighted_sum'].values.reshape(-1, 1))
        output_df['score'] = scaled_sum * 100
        # output_df['score'] = [ prob[0]*100 for prob in pred_probs ]

        # Add rankings
        output_df = output_df.sort_values(by='score', ascending=False)
        output_df['ranking'] = range(1, len(output_df) + 1)

        # Convert to dict and put all features into 'features' key
        instances_dict_list = list(output_df.T.to_dict().values())
        for output_item in instances_dict_list:  # Go over all items
            features_dict = {}
            for feature_key in feature_names:
                features_dict[ feature_key ] = output_item[ feature_key ]
                output_item.pop(feature_key, None)
            output_item['features'] = features_dict

        ranking_instance_dict = {
            'rankingId': json_request['rankingId'],
            'features': features,
            'target': target,
            'sensitiveAttr': sensitive_attr,
            'method': method,
            'stat': { 'accuracy': math.ceil(accuracy * 100) },
            'instances': instances_dict_list
        }

        return Response(json.dumps(ranking_instance_dict))


class SetSensitiveAttr(APIView):

    def post(self, request, format=None):
        sensitiveAttr = self.request.body


class RunMDS(APIView):
    def get(self, request, format=None):
        pass

    def post(self, request, format=None):
        json_request = json.loads(request.body.decode(encoding='UTF-8'))
        feature_names = [ feature['name'] for feature in json_request['features'] ]
        target_name = json_request['target']['name']
        sensitive_attr_name = json_request['sensitiveAttr']['name']

        whole_dataset_df = open_dataset('./data/german_credit_sample.csv')
        dataset_df = do_encoding_categorical_vars(whole_dataset_df)
        dataset_df = get_selected_dataset(dataset_df, feature_names, target_name, sensitive_attr_name)
        features = pd.DataFrame(dataset_df[feature_names])

        d = pairwise_distances(pd.DataFrame(features))

        df_mds_result = pd.DataFrame(MDS(n_components=2, metric=False, random_state=3).fit_transform(d), features.index)
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
        feature_names = [ feature['name'] for feature in json_request['features'] ]
        target_name = json_request['target']['name']
        sensitive_attr_name = json_request['sensitiveAttr']['name']

        whole_dataset_df = open_dataset('./data/german_credit_sample.csv')
        dataset_df = do_encoding_categorical_vars(whole_dataset_df)
        dataset_df = get_selected_dataset(dataset_df, feature_names, target_name, sensitive_attr_name)
        dataset_gower_distance = pd.DataFrame(dataset_df[ feature_names ])
        dataset_gower_distance = dataset_gower_distance.set_index(dataset_df['idx'])

        for feature in feature_names:
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

        return Response(conf_interval_points_df.to_json(orient='records'))