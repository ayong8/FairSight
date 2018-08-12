# Terms
- Observed: Input space
- Decision: Output space

# Data flows and principles
- 모든 데이터는 django(server) -> React(( state(App) -> props(Subcomponents) ))
- 업데이트는 개별적인 데이터 단위별로 이루어진다 (selected features, top-k, weights)
- 업데이트되는 raw data or user input은 state까지 전달되고,
- computation이 필요한 데이터()
- 앱 내의 메인 컴포넌트에 와서야 필요한 모든 데이터가 하나로 묶여서 view에 전달된다
    + RankingInspector에서 필요한 데이터들은 distortion, 

# Coding
- group1 == non-protected == 1 == groupColor1
- group2 == protected group == 2 == groupColor2

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

### this.state.wholeData
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
        score: 0,
        // Will be added later
        dim1: 0.35,
        dim2: 0.7,
    }
]





