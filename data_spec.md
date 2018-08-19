# Terms
- Observed: Input space
- Decision: Output space

# Data flows and principles
- 모든 데이터는 django(server) -> React(( state(App) -> props(Subcomponents) ))
- 업데이트는 개별적인 데이터 단위별로 이루어진다 (selected features, top-k, weights)
- 업데이트되는 raw data or user input은 state까지 전달되고,
- computation이 필요한 데이터(e.g., distortion)는 그것을 필요로 하는 view에 도달해서야 전달된 raw data(e.g., inputCoords)를 이용하여 계산된다
- 앱 내의 메인 컴포넌트에 와서야 필요한 모든 데이터(raw data + updated data + computed data)가 하나로 묶여서 view에 전달된다 (as this.props.data)
    + RankingInspector에서 필요한 데이터들은 distortion, inputCoords, feature values이므로 이것들을 하나로 묶는 것은 각각을 props로 내려받은 후에 RankingInspector 클래스 내에서 담당

# Coding
- group
    + group1 == non-protected == 1 == groupColor1
    + group2 == protected group == 2 == groupColor2
- pair
    + pair: 1 (both are non-protected)
    + pair: 2 (both are protected)
    + pair: 3 (between-group)

# From server

## app/dataset/view.py
## API: /dataset/

### GetSelectedFeatureDataset()
- Get all selected features
- Categorical data is factorized
    (e.g., 'man', 'woman' => 0 or 1)
- Should pass the categorical data as well
- returns
`{ {'credit_amount': 3412, 'sex': 0},`
`  {'credit_amount': 3412, 'sex': 0} }`

### RunModel()
- Run a model
- Get weights for features
- 'weighted_sum': Multiply weights by data, and sum all of them
- Scale between 0 and 1 using minmax, then
- 'score': Rescale between 0 and 100ㄴ
- 'ranking': Get ranking (ascending order by score) (1 to n)

- returns
`{ {'credit_amount': -1.2, 'sex': 1.2,` // and any other features
`   'score': 87.4, 'ranking': 4 },`
`  {'credit_amount': -1.2, 'sex': 1.2,` // and any other features
`   'score': 87.4, 'ranking': 4 } },`


# From frontend

## In redux store (hyperparameters)

top-k: 20
selectedRanking: 1
selectedRankingInstance: {
    idx
    model
    sensitiveAttr
    selectedFeatures
    summary: {
        groupFairness
        individualFairness
        accuracy/utility
        ranking
    }
}

## this.state

### this.state.output
`[`
`  { age: -0.3548929154,`
`   credit_amount: -5.1897971678,`
`   group: 2,`
`   installment_as_income_perc: 1.3230743362,`
`   ranking: 1,`
`   score: 0,`
`   sex: 0.2422882226,`
`   weighted_sum: -3.9793275244}, ...`
`]`

### this.state.output
각각은 데이터포인트들...
[
    {
        x: {
            age: 55,
            credit_amount: 5067,
            sex: 1   // woman
        },
        y: { default: 0 },
        weighted_x: {
            age: -0.3549,
            credit_amount: -5.433,
            sex: 0.499
        },
        weighted_sum: -3.978,
        group: 1,
        ranking: 1,
        score: 0
    }
]

### this.state.inputCoords
[
    {
        idx: 1,
        dim1: 0.495,
        dim2: 0.245,
        group: 2,
        default: 0
    }
]

## Compute data

pairwiseDiffs (in RankingInspector/index.js)
- Input(this.props.inputCoords, this.props.output)
    + inputCoords: input data의 dim reduction 결과물
    + output: 알고리즘 결과물, ranking 데이터
- pairwise로 변환
- input, output을 각각 scale between 0 and 1

[
    {
        idx1: d[0].idx,
        idx2: d[1].idx,
        pair: Math.floor(Math.random() * 3) + 1,  // for now, pair is a random => (1: Woman and Woman, 2: Woman and Man, 3: Man and Man)
        diffInput: diffInput,
        diffOutput: diffOutput,
        scaledDiffInput: this.observedScale(diffInput),
        scaledDiffOutput: this.observedScale(diffOutput)
    }
]

distortion (in individualFairnessView.js)


# 각 뷰마다 다른 combined data

## RankingInspector
- this.state.inputCoords + this.state.output

## (RankingInspector =>) IndividualFairnessView
- 필요한 데이터
    + Matrix view
        * feature values => x, y (per data point)
        * distortions (per permutation pairwise)

[
    {
      idx: currentIdx,
      x: xObj,
      y: yObj,
      group: groupObj[sensitiveAttr],
      ranking: rankingObj.ranking,
      score: scoreObj.score,
      // computed (and added by method)
      sumDistortion: 3.04
    }
]

# Render

## Matrix view
2D-array, [row(y), column(x)]

### Ordering
- matrix의 scale은 인덱스로 되어있다
    (50개면, 0-49로 discrete scale(scaleBand()))
- 특정 feature 또는 distortion으로 정렬하고 싶다면
    + 데이터 배열을 특정값 기준으로 정렬하고
    + 정렬된 기준으로 인덱스를 다시 씌운다












