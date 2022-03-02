import { connect } from 'react-redux';
import BreadCrumb from '../BreadCrumb';
import Button from '../../styles/Button';
import React, { Component } from 'react';
import { ConfigContainer } from '../../styles/ConfigContainer';
import { Creators as ScreenActions } from '../../store/ducks/screen';
import { Creators as CourseActions } from '../../store/ducks/course';
import { Creators as SubjectActions } from '../../store/ducks/subject';
import { Creators as SemesterActions } from '../../store/ducks/semester';
import { Creators as IndicatorActions } from '../../store/ducks/indicator';
import { Creators as PreProcessingActions } from '../../store/ducks/pre_processing';
import { actions as toastrActions } from 'react-redux-toastr';
import {
  Header, Content,  RightContainer} from './styles';
import { DATASOURCE, ADD_TRAIN, LMS, CLUSTERING } from '../../constants';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { PickList } from 'primereact/picklist';

/* Essa page foi replicada a partir da page Indicators. Ela foi adaptada para suportar
apenas clusterização */

class Indicators2 extends Component {

  componentDidMount() {
    const dataSourceContext = this.getDataSourceContext();

    if (dataSourceContext === LMS) {
      this.props.getCourses({ datasource: this.getDataSourceId() });
    };

    this.props.indicatorInitFilter();
  }

  getDataSourceContext = () => this.props.indicator.datasource ? this.props.indicator.datasource.split('/')[0] : null;
  // obtém o id da fonte de dados a ser treinada
  getDataSourceId = () => this.props.indicator.datasource ? this.props.indicator.datasource.split('/')[1] : null;

  getPickListTemplate(item) {
    return (
      <div className="p-clearfix">
        <div style={{ fontSize: '14px', textAlign: 'right', margin: '15px 5px 0 0' }}>{item.label}</div>
      </div>
    );
  }

  onPickListChange(event) {
    this.props.setIndicator('source', event.source);
    this.props.setIndicator('indicators', event.target);
  }

  renderWarningMsg = (msg) => {
    this.props.add({
      type: 'warning',
      title: 'Atenção',
      message: msg
    });
  }

  onSubmit = () => {
    const { setScreen } = this.props;
    const { indicators } = this.props.indicator;
    console.log(indicators)

    if (!indicators || !indicators.length || indicators.length <= 1) {
      this.renderWarningMsg('Selecione ao menos dois indicadores');
      return;
    }
    // vai para a ClusteringPage
    setScreen(ADD_TRAIN, CLUSTERING);
  }

  getValueFromSelect = items => {
    if (!items) {
      return null;
    }

    return items.map(item => item.value);
  }

  render() {

    const { source, indicators} = this.props.indicator;
    console.log(this.getDataSourceId())

    return (
      <ConfigContainer size='big'>
        <PerfectScrollbar style={{ width: '100%' }}>
          <div style={{ width: '35%' }}>
            <BreadCrumb text='Voltar para Escolha de Fontes de dados' screen={ADD_TRAIN} destiny={DATASOURCE} />
          </div>
          <Header>
            <h1>Selecione os indicadores para o treinamento</h1>
            <div>
              <Button onClick={this.onSubmit.bind(this)}>IR PARA CLUSTERIZAÇÃO</Button>
            </div>
          </Header>

          <Content>

            <RightContainer>
              <PickList
                metaKeySelection={false}
                responsive={true}
                showSourceControls={false}
                showTargetControls={false}
                sourceHeader="Disponíveis"
                targetHeader="Selecionados"
                source={source}
                target={indicators}
                onChange={this.onPickListChange.bind(this)}
                itemTemplate={this.getPickListTemplate.bind(this)}
                sourceStyle={{ height: '40vh', width: '28vw' }} targetStyle={{ height: '40vh', width: '28vw' }}
              />
            </RightContainer>

          </Content>
        </PerfectScrollbar>
      </ConfigContainer>
    );
  }
}

const mapStateToProps = ({ indicator }) => ({ indicator});

export default connect(
  mapStateToProps,
  {
    ...ScreenActions,
    ...IndicatorActions, ...toastrActions
  }
)(Indicators2);