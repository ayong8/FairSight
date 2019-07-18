import React, { Component } from 'react';
import {
  Alert,
  FormGroup,
  FormText,
  Input,
  Label,
  Badge,
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem
} from 'reactstrap';
import Slider from 'react-rangeslider';
import { Button, Steps, Icon } from 'antd';

import styles from './styles.scss';
import index from '../../index.css';

class Menubar extends Component {
  constructor(props) {
    super(props);

    this.toggle = this.toggle.bind(this);
    this.state = {
      dropdownOpen: false,
      dataset: {},
      ranking: {}
    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (this.props.topk !== nextProps.topk) {
      return true;
    }
    if (this.props.data !== nextProps.data) {
      return true;
    }

    return false;
  }

  toggle() {
    this.setState({
      dropdownOpen: !this.state.dropdownOpen
    });

    //this.props.onSelectSensitiveAttr(sensitiveAttr); // Then declare it
  }

  render() {
    if (!this.props.data || this.props.data.length === 0) {
      return <div />;
    }
    const Step = Steps.Step;
    const data = this.props.data;

    return (
      <div className={styles.Menubar}>
        <div className={styles.appTitle}>FAIRSIGHT</div>
        <div className={styles.addRanking}>
          <Button>+</Button>
        </div>
      </div>
    );
  }
}

export default Menubar;
