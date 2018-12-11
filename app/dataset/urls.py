from django.conf.urls import url
from . import views

urlpatterns = [
    url(
        regex=r'^file/$',
        view=views.LoadFile.as_view(),
        name='file'
    ),
    url(
        regex=r'^extractFeatures/$',
        view=views.ExtractFeatures.as_view(),
        name='features'
    ),
    url(
        regex=r'^runRankSVM/$',
        view=views.RunRankSVM.as_view(),
        name='rankSVM'
    ),
    # url(
    #     regex=r'^runRankSVMForPerturbation/$',
    #     view=views.RunRankSVMForPerturbation.as_view(),
    #     name='rankSVMForPerturbation'
    # ),
    url(
        regex=r'^runSVM/$',
        view=views.RunSVM.as_view(),
        name='SVM'
    ),
    url(
        regex=r'^runSVMForPerturbation/$',
        view=views.RunSVMForPerturbation.as_view(),
        name='SVMForPerturbation'
    ),
    url(
        regex=r'^runLR/$',
        view=views.RunLR.as_view(),
        name='LR'
    ),
    url(
        regex=r'^runLRForPerturbation/$',
        view=views.RunLRForPerturbation.as_view(),
        name='LRForPerturbation'
    ),
    url(
        regex=r'^runACF/$',
        view=views.RunACF.as_view(),
        name='ACF'
    ),
    url(
        regex=r'^runACFForPerturbation/$',
        view=views.RunACFForPerturbation.as_view(),
        name='ACFForPerturbation'
    ),
    url(
        regex=r'^runMDS/$',
        view=views.RunMDS.as_view(),
        name='mds'
    ),
    url(
        regex=r'^setSensitiveAttr/$',
        view=views.SetSensitiveAttr.as_view(),
        name='sensitiveAttr'
    ),
    url(
        regex=r'^calculatePairwiseInputDistance/$',
        view=views.CalculatePairwiseInputDistance.as_view(),
        name='pairwiseInputDistance'
    ),
    url(
        regex=r'^calculateConfidenceInterval/$',
        view=views.CalculateConfidenceInterval.as_view(),
        name='confidenceInterval'
    ),
    url(
        regex=r'^calculateAndersonDarlingTest/$',
        view=views.CalculateAndersonDarlingTest.as_view(),
        name='wassersteinDistance'
    )
]