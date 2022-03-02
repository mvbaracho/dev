import React, { Component } from 'react';
import { CardContainer } from './styles';
import { Creators as DialogActions } from '../../store/ducks/dialog';
import { Creators as LmsActions } from '../../store/ducks/lms';
import { Creators as DataSourceActions } from '../../store/ducks/data_source';
import { connect } from 'react-redux';
import { default as CustomButton } from '../../styles/Button';
import { ConfigContainer } from '../../styles/ConfigContainer';
import { Header, fontFamily, primaryColor, StatusMsgContainer } from '../../styles/global';
import PerfectScrollbar from 'react-perfect-scrollbar';
import Card from '@material-ui/core/Card';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import Chip from '@material-ui/core/Chip';
import MonitorIcon from 'react-feather/dist/icons/monitor';
import EditIcon from 'react-feather/dist/icons/settings';
import DeleteIcon from 'react-feather/dist/icons/trash-2';
import PlayIcon from 'react-feather/dist/icons/play';
import SlackIcon from 'react-feather/dist/icons/slack';
import FileIcon from 'react-feather/dist/icons/file';
import MoodleConfigDialog from '../MoodleConfigDialog';
import { INDICATORS, ADD_TRAIN, LMS, CSV, CLUSTERING, INDICATORS2 } from '../../constants';
import { Creators as ScreenActions } from '../../store/ducks/screen';
import { Creators as IndicatorActions } from '../../store/ducks/indicator';
import DataSourceDialog from '../DataSourceDialog';
import * as moment from 'moment';
import IconButton from '@material-ui/core/IconButton';
import { ProgressSpinner } from 'primereact/progressspinner';
import AlertDialog from '../AlertDialog';
import filesize from "filesize";

const availableLms = { moodle: true };

class DataSource extends Component {

  state = {
    selectedItem: null,
    chipSelected: LMS
  }

  componentWillMount() {
    this.props.getDataSource();
  }

  openDialogConfig = (item, event) => {
    if (!availableLms[item.name]) return;

    this.props.setDialog(item.name, {
      ...item,
      version: {
        label: item.version, value: item.version
      }
    })
  }
  // Essa parte é responsável por renderizar os cards
  renderCardLMS = (item, idx) => (
    <Card className='lms-card' key={idx} style={{ opacity: availableLms[item.name] ? 1 : .3 }}>
      <CardActionArea>
        <CardContent style={{ color: primaryColor }}>
          <Typography gutterBottom variant="h5" component="h2" style={{ fontFamily: fontFamily }}>
            {item.description}
          </Typography>
          <Typography variant="body2" color="textSecondary" component="p" style={{ color: primaryColor, fontFamily: fontFamily, fontSize: '10px' }}>
            Versão: {item.version ? item.version : 'Não disponível'}
          </Typography>
        </CardContent>
      </CardActionArea> {/* Essa parte possui o botão de ir pra os indicadores e o botão
      de engrenagem, que abre a dialog de configuração*/}
      <CardActions style={{ backgroundColor: primaryColor }}>
       <IconButton onClick={this.goToIndicators.bind(this, LMS, item.name, item.description)}>
          <PlayIcon size={20} color={'#FFF'} />
        </IconButton>
        <IconButton onClick={this.openDialogConfig.bind(this, item)}>
          <EditIcon size={20} color={'#FFF'} />
        </IconButton>
      </CardActions>
    </Card>
  )
      // Essa parte é responsável pelos cards das fontes de dados inseridas pelo usuário
  renderCardCSV = (item, idx) => (
    <Card className='lms-card' key={idx}>
      <CardActionArea>
        <CardContent style={{ color: primaryColor }}>
          <Typography gutterBottom variant="h5" component="h2" style={{ fontFamily: fontFamily }}>
            {item.name}
          </Typography>
          <Typography variant="body2" color="textSecondary" component="p" style={{ color: primaryColor, fontFamily: fontFamily, fontSize: '10px' }}>
            <b>Importado em:</b> {moment(item.created_at).format('DD/MM/YYYY HH:mm')}
          </Typography>
          <Typography variant="body2" color="textSecondary" component="p" style={{ color: primaryColor, fontFamily: fontFamily, fontSize: '10px' }}>
            <b>Tamanho:</b> {filesize(item.size)}
          </Typography>
        </CardContent>
      </CardActionArea>
      <CardActions style={{ backgroundColor: primaryColor }}>
        <IconButton onClick={this.goToIndicators.bind(this, CSV, item.id, item.name)}>
          <PlayIcon size={20} color={'#FFF'} />
        </IconButton> 
        {/* Essa parte é responsável por deletar a fonte de dados*/}
        <IconButton onClick={this.handleMsgDelete.bind(this, item)}>
          <DeleteIcon size={20} color={'#FFF'} />
        </IconButton>
        <IconButton onClick={this.goToIndicators2.bind(this, CSV, item.id, item.name)}>
            <SlackIcon size={20} color={'#FFF'} />
        </IconButton>
      </CardActions>
      {/* Adicionado por Daniel */}
      {/* <div>
          <CustomButton filled={false} onClick={this.addClustering.bind(this,item)}>Clusterizar</CustomButton>
      </div> */}
      {/* <div>
          <CustomButton filled={false} onClick={this.goToClustering.bind(this,CSV, item.id, item.name)}>Clusterizar</CustomButton>
      </div> */}
      {/* Daqui pra cima Adicionado por Daniel */}
    </Card>
  )
 // esse método é chamado ao clicar na lixeira: muda o state pra o item selecionado
 // ser o item que a pessoa clicou
  handleMsgDelete = (item, event) => {
    this.setState({ selectedItem: item });
    // abre a dialog de alerta, perguntando se a pessoa quer excluir a fonte ou não
    this.props.setDialog('alert', {
      description: 'Você realmente deseja excluir esta fonte de dados?'
    });
  }
  // deleta de fato a fonte de dados, pegando o selectedItem do state e chamando o método
  // deleteDataSource passando o item selecionado
  handleDelete = () => {
    const { selectedItem } = this.state;

    if (!selectedItem || !selectedItem.id) return;

    this.props.deleteDataSource(selectedItem.id);
  }
  // esse método vai para a página de indicadores
  goToIndicators = (context, id, name, event) => {
    const key = `${context}/${id}/${name}`;
    if (context === LMS && !availableLms[id]) return;
    // setScreen leva para a página de indicadores
    this.props.setScreen(ADD_TRAIN, INDICATORS);
    this.props.setIndicator('datasource', key);
    this.props.getIndicators({ context, id });
  }

  goToIndicators2 = (context, id, name, event) => {    
    const key = `${context}/${id}/${name}`;
    if (context === LMS && !availableLms[id]) return;
    // setScreen leva para a página de indicadores
    this.props.setScreen(ADD_TRAIN, INDICATORS2);
    this.props.setIndicator('datasource', key);
    this.props.getIndicators({ context, id });
  }

  goToClustering = (context, id, name, event) => {
    const key = `${context}/${id}/${name}`;
    if (context === LMS && !availableLms[id]) return;
    // setScreen leva para a página de indicadores
    this.props.setScreen(ADD_TRAIN, CLUSTERING);
    this.props.setIndicator('datasource', key);
    this.props.getIndicators({ context, id });
  }


  // serve para setar qual a "aba" selecionada, que aqui é chamada de CHIP
  setChip = (value, event) => this.setState({ chipSelected: value });
  // renderiza os dois chips, no caso as abas "Ambientes EAD" e "Arquivos CSV"
  renderDatasetOptions = () => {
    const { chipSelected } = this.state;

    return (
      <div style={{ display: 'flex', paddingLeft: '2rem' }}>
        <div>
          <Chip
            avatar={<MonitorIcon size={16} color={chipSelected === LMS ? '#FFF' : primaryColor} />}
            label="Ambientes EAD"
            className={chipSelected === LMS ? 'active-chip' : 'inactive-chip'}
            onClick={this.setChip.bind(this, LMS)}
          />
        </div>
        <div style={{ paddingLeft: '.5vw' }}>
          <Chip
            avatar={<FileIcon size={16} color={chipSelected === CSV ? '#FFF' : primaryColor} />}
            label="Arquivos CSV"
            className={chipSelected === CSV ? 'active-chip' : 'inactive-chip'}
            onClick={this.setChip.bind(this, CSV)}
          />
        </div>
      </div>
    )
  }
  // cria o método addDataSource para abrir uma dialog para adicionar fonte de dados
  addDataSource = () => this.props.setDialog('dataSource');

  // addClustering = (item) => this.props.setDialog('clustering',item);

// aqui se inicia de fato o método render, mostrando o que deve ser exibido
  render() {
    const { chipSelected } = this.state;
    const { lms, data_source } = this.props;
    const loading = !!data_source.loading;
    const hasData = !!data_source.data.length;

    return (
      // Exibe de fato a página de dataSources
      <PerfectScrollbar style={{ width: '100%' }}>
        <ConfigContainer style={{ minHeight: '70%' }}>

          <Header>
            <h1>Fontes de Dados</h1>
            <div>
              <CustomButton filled={false} onClick={this.addDataSource}>Adicionar fonte de dados</CustomButton>
            </div>
            {/*Adicionado por mim*/}
          </Header>
          
          {/* chama o método renderDataSetOptions para mostrar os dois chips*/}
          {this.renderDatasetOptions()}
          {/* Obtém todas as fontes de dados vindas do LMS e renderiza usando renderCardLMS*/}
          {chipSelected === LMS ?
            <CardContainer>{lms.data.map((item, idx) => this.renderCardLMS(item, idx))}</CardContainer>
            : null}
          {/* Obtém todas as fontes de dados CSV e renderiza usando renderCardCSV*/}
          {chipSelected === CSV ?
            <CardContainer>{data_source.data.map((item, idx) => this.renderCardCSV(item, idx))}</CardContainer>
            : null}

          {chipSelected === CSV && loading && (
            <StatusMsgContainer>
              <ProgressSpinner style={{ width: '50px', height: '50px' }} strokeWidth="4" fill="#EEEEEE" animationDuration=".5s" />
            </StatusMsgContainer>
          )}
          {/* Caso a fonte seja CSV e não haja dados, exibe mensagem que não
          existe fonte de dados*/}
          {chipSelected === CSV && !hasData && !loading && (
            <StatusMsgContainer>Nenhuma fonte de dados cadastrada</StatusMsgContainer>
          )}
        </ConfigContainer>  
        {/* Aqui chama a dialog de configuração do moodle*/}
        <MoodleConfigDialog />
        {/* Aqui abre a dialog de dataSOurce, para adiciconar nova fonte de dados*/}
        <DataSourceDialog />
        {/* Chama a AlertDialog caso queira excluir um item*/}
        <AlertDialog onSubmit={this.handleDelete}></AlertDialog>
      </PerfectScrollbar>
    );
  }
}

const mapStateToProps = ({ lms, data_source }) => ({ lms, data_source });

export default connect(
  mapStateToProps, {
  ...DialogActions, ...LmsActions,
  ...ScreenActions, ...IndicatorActions,
  ...DataSourceActions
}
)(DataSource);