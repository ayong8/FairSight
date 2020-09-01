import itertools

import numpy as np

from sklearn.linear_model import SGDClassifier, SGDRanking
from sklearn import metrics
from minirank.compat import RankSVM as MinirankSVM
from scipy import stats


def transform_pairwise(X, y):
    """Transforms data into pairs with balanced labels for ranking
    Transforms a n-class ranking problem into a two-class classification
    problem. Subclasses implementing particular strategies for choosing
    pairs should override this method.
    In this method, all pairs are choosen, except for those that have the
    same target value. The output is an array of balanced classes, i.e.
    there are the same number of -1 as +1
    Parameters
    ----------
    X : array, shape (n_samples, n_features)
        The data
    y : array, shape (n_samples,) or (n_samples, 2)
        Target labels. If it's a 2D array, the second column represents
        the grouping of samples, i.e., samples with different groups will
        not be considered.
    Returns
    -------
    X_trans : array, shape (k, n_feaures)
        Data as pairs
    y_trans : array, shape (k,)
        Output class labels, where classes have values {-1, +1}
    """
    X_new = []
    y_new = []
    y = np.asarray(y)
    if y.ndim == 1:
        y = np.c_[y, np.ones(y.shape[0])]
    comb = itertools.combinations(range(X.shape[0]), 2)
    for k, (i, j) in enumerate(comb):
        if y[i, 0] == y[j, 0] or y[i, 1] != y[j, 1]:
            # skip if same target or different group
            continue
        X_new.append(X[i] - X[j])
        y_new.append(np.sign(y[i, 0] - y[j, 0]))
        # output balanced classes
        if y_new[-1] != (-1) ** k:
            y_new[-1] = - y_new[-1]
            X_new[-1] = - X_new[-1]
    return np.asarray(X_new), np.asarray(y_new).ravel()


class RankSVM(SGDClassifier):
    """Performs pairwise ranking with an underlying SGDClassifer model
    Input should be a n-class ranking problem, this object will convert it
    into a two-class classification problem, a setting known as
    `pairwise ranking`.
    Authors: Fabian Pedregosa <fabian@fseoane.net>
             Alexandre Gramfort <alexandre.gramfort@inria.fr>
    https://gist.github.com/2071994
    """

    def fit(self, X, y):
        """
        Fit a pairwise ranking model.
        Parameters
        ----------
        X : array, shape (n_samples, n_features)
        y : array, shape (n_samples,) or (n_samples, 2)
        Returns
        -------
        self
        """
        X_trans, y_trans = transform_pairwise(X, y)
        super(RankSVM, self).fit(X_trans, y_trans)
        return self

    def predict(self, X):
        pred = super(RankSVM, self).predict(X)
        # preds are mapped to {-1,1}
        # FIXME only works in this example!!!
        pred[pred == -1] = 0
        return pred

    def score(self, X, y):
        """
        Because we transformed into a pairwise problem, chance level is at 0.5
        """
        X_trans, y_trans = transform_pairwise(X, y)
        return np.mean(super(RankSVM, self).predict(X_trans) == y_trans)

def rank(clf,X):
    if clf.coef_.shape[0] == 1:
        coef = clf.coef_[0]
    else:
        coef = clf.coef_ 
    order = np.argsort(np.dot(X,coef))
    order_inv = np.zeros_like(order)
    order_inv[order] = np.arange(len(order))
    return order_inv

def kendalltau(clf,X,y):
    if clf.coef_.shape[0] == 1:
        coef = clf.coef_[0]
    else:
        coef = clf.coef_     
    tau, _ = stats.kendalltau(np.dot(X, coef), y)
    return np.abs(tau)


if __name__=="__main__":
    rs = np.random.RandomState(0)
    n_samples_1 = 10000
    n_samples_2 = 100
    X = np.r_[1.5 * rs.randn(n_samples_1, 2),
              0.5 * rs.randn(n_samples_2, 2) + [2, 2]]
    y = np.array([0] * (n_samples_1) + [1] * (n_samples_2))
    idx = np.arange(y.shape[0])
    rs.shuffle(idx)
    X = X[idx]
    y = y[idx]
    mean = X.mean(axis=0)
    std = X.std(axis=0)
    X = (X - mean) / std

    for clf, name in ((SGDClassifier(n_iter=100, alpha=0.01), "plain sgd"),
                      (SGDClassifier(n_iter=100, alpha=0.01,
                                     class_weight={1: 10}),"weighted sgd"),
                      (SGDRanking(n_iter=1000, alpha=0.01,
                                     loss='roc_pairwise_ranking'), "pairwise sgd"),
                      (RankSVM(n_iter=100, alpha=0.01, loss='hinge'), 'RankSVM'),
                      ):
        clf.fit(X, y)
        print clf
        pred = clf.predict(X)

        print "ACC: %.4f" % metrics.zero_one_score(y, pred)
        print "AUC: %.4f" % metrics.auc_score(y, pred)
        print "CONFUSION MATRIX: "
        print metrics.confusion_matrix(y, pred)
        print "Kendall Tau: %.4f" % kendalltau(clf,X,y)
        print 80*'='
    
    clf = MinirankSVM(max_iter=100, alpha=0.01).fit(X,y)
    print clf
    scores = np.dot(X,clf.coef_)
    pred = (scores > 0).astype(np.int)
    print "ACC: %.4f" % metrics.zero_one_score(y, pred)
    print "AUC: %.4f" % metrics.auc_score(y, pred)
    print "CONFUSION MATRIX: "
    print metrics.confusion_matrix(y, pred)
    print "Kendall Tau: %.4f" % kendalltau(clf,X,y)
    print 80*'='    