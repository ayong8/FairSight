import React, { Component } from "react";
import { Table } from 'reactstrap';

import styles from "./styles.scss";
import index from "../../index.css";

let rankingList = [];

class TableView extends Component {
  constructor(props) {
    super(props);
    this.handleSearchChange = this.handleSearchChange.bind(this);

    this.state = {
      searchKeyword: ''
    }
  }

  handleSearchChange(e) {
    this.setState({
      searchKeyword: e.target.value
    });
  }

  render() {
    return (
      <div className={styles.TableView}>
        <div className={index.title}>Dataset</div>
        <div>
          <input 
            type='text'
            name='name'
            placeholder='search'
            onChange={this.handleSearchChange}
          />
        </div>
        <Table striped>
          <thead>
            <tr>
              <th>#</th>
              <th>First Name</th>
              <th>Last Name</th>
              <th>Username</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">1</th>
              <td>Mark</td>
              <td>Otto</td>
              <td>@mdo</td>
            </tr>
            <tr>
              <th scope="row">2</th>
              <td>Jacob</td>
              <td>Thornton</td>
              <td>@fat</td>
            </tr>
            <tr>
              <th scope="row">3</th>
              <td>Larry</td>
              <td>the Bird</td>
              <td>@twitter</td>
            </tr>
          </tbody>
        </Table>
      </div>
    );
  }
}

export default TableView;
