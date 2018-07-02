import 'bootstrap/dist/css/bootstrap.css';

import React, { Component } from "react";
import { Alert, Button, FormGroup, FormText, Input, Label,
        Dropdown, DropdownToggle, DropdownMenu, DropdownItem 
      } from 'reactstrap';
import styles from "./styles.scss";

const show = {
  display: 'flex'
}

class Generator extends Component {
  constructor(props) {
    super(props);

    this.toggle = this.toggle.bind(this);
    this.state = {
      dropdownOpen: false
    };
  }

  toggle() {
    this.setState({
      dropdownOpen: !this.state.dropdownOpen
    });
  }

  render() {
    return (
        <Dropdown className={styles.Generator} isOpen={this.state.dropdownOpen} toggle={this.toggle} left>
          <span>ddddddddd</span>
          <DropdownToggle
            tag="span"
            onClick={this.toggle}
            data-toggle="dropdown"
            aria-expanded={this.state.dropdownOpen}
          >
            <span>DOWN</span>
          </DropdownToggle>
          <DropdownMenu right>
            <DataLoader className={styles.DataLoader}/>
            <FeatureSelector className={styles.FeatureSelector}/>
            <MethodSelector className={styles.MethodSelector}/>
            <FairnessOrganizer className={styles.FairnessOrganizer}/>
          </DropdownMenu>
        </Dropdown>
    );
  }
}

class DataLoader extends Component {
  render(){
    return (
      <div className={styles.DataLoader}>
        <span>1. Upload a dataset</span>
        <FormGroup>
          <Label for="exampleFile">File</Label>
          <Input type="file" name="file" id="exampleFile" />
          <FormText color="muted">
            This is some placeholder block-level help text for the above input.
            It's a bit lighter and easily wraps to a new line.
          </FormText>
        </FormGroup>
      </div>
    );
  }
}

class FeatureSelector extends Component {
  constructor(props) {
    super(props);

    this.toggle.bind(this);
    this.state = {
      dropdownOpen: false
    };
  }

  toggle() {
    this.setState(prevState => ({
      dropdownOpen: !prevState.dropdownOpen
    }));
  }

  render(){
    return (
      <div className={styles.FeatureSelector}>
        <span>2. Select attributes and sensitive...</span>
        <div className={styles.FeatureSelectorWrapper}>
          <div className={styles.SensitiveAttrSelector}>
          <Dropdown isOpen={this.state.dropdownOpen} toggle={this.toggle}>
            <DropdownToggle
              tag="span"
              onClick={this.toggle}
              data-toggle="dropdown"
              aria-expanded={this.state.dropdownOpen}
            >
              Features
            </DropdownToggle>
            <DropdownMenu>
              <DropdownItem>Feature1</DropdownItem>
              <DropdownItem>Feature2</DropdownItem>
            </DropdownMenu>
          </Dropdown>
          </div>
          <div className={styles.sensitiveAttributes}>
            Men, Women
          </div>
          <div className={styles.FeatureSelector}>
          </div>
        </div>
      </div>
    );
  }
}

class MethodSelector extends Component {
  render(){
    return (
      <div className={styles.MethodSelector}>
      </div>
    );
  }
}

class FairnessOrganizer extends Component {
  render(){
    return (
      <div className={styles.FairnessOrganizer}>
      </div>
    );
  }
}

export default Generator;
