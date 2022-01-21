import React, { Component } from 'react';

import { Container } from './styles';
import { connect } from 'react-redux';

import { bindActionCreators } from 'redux';

import SideMenu from '../../components/SideMenu';
import DataSource from '../../components/DataSource';
import Indicators from '../../components/Indicators';
import PreProcessing from '../../components/PreProcessing';
import { Creators as ScreenActions } from '../../store/ducks/screen';
import { Creators as LmsActions } from '../../store/ducks/lms';
import { DATASOURCE, INDICATORS, PRE_PROCESSING, TRAIN, TRAIN_MODEL, LAD, TRAIN_TEST_REGRESSION } from '../../constants';
import Train from '../../components/Train';
import TrainModel from '../TrainModel';
import Dashboard from '../../components/Dashboard';
import Regression from '../../components/Regression';

class Main extends Component {

  componentDidMount() {
    this.props.getLms();
  }

  renderContent = () => {
    const { activeComponent } = this.props.screen;

    if (activeComponent === DATASOURCE) {
      return <DataSource />;
    }

    if (activeComponent === INDICATORS) {
      return <Indicators />;
    }

    if (activeComponent === PRE_PROCESSING) {
      return <PreProcessing />;
    }

    if (activeComponent === TRAIN) {
      return <Train />;
    }

    if (activeComponent === TRAIN_MODEL) {
      return <TrainModel />;
    }

    if (activeComponent === LAD) {
      return <Dashboard />;
    }

    if(activeComponent === TRAIN_TEST_REGRESSION) {
      return <Regression />;
    }

    return null;
  }

  render() {
    return (
      <Container>
        <SideMenu />
        {this.renderContent()}
      </Container>
    )
  }
}

const mapStateToProps = ({ screen }) => ({ screen });

const mapDispatchToProps = (dispatch) =>
  bindActionCreators({ ...ScreenActions, ...LmsActions }, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(Main);