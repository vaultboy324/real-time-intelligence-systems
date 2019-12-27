import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import Table from "./Components/Table/Table";

class App extends Component {
  render() {
    return (
      <div className="App">
        <Table/>
      </div>
    );
  }
}

export default App;
