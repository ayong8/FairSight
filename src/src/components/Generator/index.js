import 'bootstrap/dist/css/bootstrap.css';

import React, { Component } from "react";
import { Alert, Button } from 'reactstrap';
import styles from "./styles.scss";

class DataLoader extends Component {
  render(){
    return (
      <div className={styles.DataLoader}>
      </div>
    );
  }
}

class FeatureSelector extends Component {
  render(){
    return (
      <div className={styles.FeatureSelector}>
        <Alert color="primary">
          This is a primary alert — check it out!
        </Alert>
        <Button color="primary">data</Button>
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

class Generator extends Component {
  render() {
    return (
      <div className={styles.Generator}>
        <DataLoader className={styles.DataLoader}/>
        <FeatureSelector className={styles.FeatureSelector}/>
        <MethodSelector className={styles.MethodSelector}/>
        <FairnessOrganizer className={styles.FairnessOrganizer}/>
      </div>
    );
  }
}

export default Generator;
