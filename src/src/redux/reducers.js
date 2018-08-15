import { combineReducers } from 'redux';
import { SET_TOP_K } from './actions';

const { SHOW_ALL } = VisibilityFilters;

function topk(state = 40, action) {
  switch (action.type) {
    case SET_TOP_K:
      return action.topk;
    default:
      return state;
  }
}

function visibilityFilter(state = SHOW_ALL, action) {
  switch (action.type) {
  case SET_VISIBILITY_FILTER:
    return action.filter;
  default:
    return state;
  }
}

function todos(state = [], action) {
  switch (action.type) {
  case ADD_TODO:
    return [...state, {
      text: action.text,
      completed: false
    }];
  case COMPLETE_TODO:
    return [
      ...state.slice(0, action.index),
      Object.assign({}, state[action.index], {
        completed: true
      }),
      ...state.slice(action.index + 1)
    ];
  default:
    return state;
  }
}

const appReducer = combineReducers({
  topk
});

export default appReducer;