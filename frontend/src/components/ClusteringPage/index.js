import { connect } from 'react-redux';
import BreadCrumb from '../BreadCrumb';
import Button from '../../styles/Button';
import React, { Component } from 'react';
import { ConfigContainer } from '../../styles/ConfigContainer';
import { Creators as ScreenActions } from '../../store/ducks/screen';
import { Creators as CourseActions } from '../../store/ducks/course';
import { Creators as SubjectActions } from '../../store/ducks/subject';
import { Creators as SemesterActions } from '../../store/ducks/semester';
import indicator, { Creators as IndicatorActions } from '../../store/ducks/indicator';
import { Creators as PreProcessingActions } from '../../store/ducks/pre_processing';
import { actions as toastrActions } from 'react-redux-toastr';
import {
  Header, Separator, Content, LeftContent,
  RightContainer, StyledParagraph, StyledDiv, StyledTitle
} from './styles';
import { DATASOURCE, ADD_TRAIN} from '../../constants';
import PerfectScrollbar from 'react-perfect-scrollbar';
import {
  DialogInput, DialogSpan
} from '../../styles/global';
import { ProgressSpinner } from 'primereact/progressspinner';
import { downloadStreamClust } from '../../utils/utils';
import DownloadIcon from 'react-feather/dist/icons/download';
import api from '../../services/api';



// CONSTANTES ---------------------------------------------------------
const partitioning= [
	{value: 'kmeans', label: 'k-means'},
	{value:'kmodes', label: 'k-modes'}
];
// hierárquico
const hierarchical = [{value: 'hclust', label: 'Agglomerative Clustering'},
                      {value: 'birch', label: 'BIRCH'}];
// densidade
const density = [{value: 'dbscan', label: 'DBSCAN'}];

const normtype = [ 
      { value: 'zscore', label: 'ZScore'},
      { value: 'minmax' , label: "MinMax"},
      { value: 'maxabs' , label: "MaxAbs"},
      { value: 'robust' , label: "Robust"} 
]

/** guarda o tipo de abordagem de acordo com o que foi selecionado na primeira dropdown */
let type = null;

// essa variável vai ser populada para formar a segunda dropdown
let options = null;


class ClusteringPage extends Component {

  state = {
    algorithm: "",
    selected: "",
    normalize: false,
    normalizationtype: "zscore",
    features: "",
    num_features: "",
    num_clusters: "",
    distrib_feature: "",
    view: true,
    returnedID: "",
    images: [],
    metrics: [{silhouette: ""}, {daviesbouldin: ""},{calinski: ""}],
    loading: false
  };

  getDataSourceContext = () => this.props.indicator.datasource ? this.props.indicator.datasource.split('/')[2] : null;

  getDataSourceId = () => this.props.indicator.datasource ? this.props.indicator.datasource.split('/')[1] : null;

  getFiles = () => {
    const {returnedID} = this.state
    api.get('result/' + returnedID, { responseType: 'blob' })
    .then(response=>{
      downloadStreamClust({id: returnedID, content: response.data})
      console.log('sucesso')})
    .catch((err) => {
      this.renderWarningMsg('Não foi possível baixar o arquivo. ' + err)
      console.error("Ocorreu um erro " + err);
    });
  }
  
  
  getImages = (data, algorithm) => {

       const obj = Object.values(data)[1]

       // Aqui eu seto o state das métricas, pegando do objeto retornado do backend
       this.setState(prevState => ({
          metrics: {                   
            ...prevState.metrics,    
            silhouette: obj.Silhouette,
            daviesbouldin: obj.DaviesBouldin,
            calinski: obj.CalinskiHarabasz      
        }
    }))
    // Chama o backend para retornar as imagens, passando o id e o algoritmo escolhido
    api.get('images-clustering/' + data.id + '/' + algorithm)
      .then(response => {
        let newlist = []
        for(let i=0; i<Object.values(response.data).length;i++){
            newlist.push((Object.values(response.data)[i]))
        }
        // Obtém as imagens e atribui da lista newList para a variável do State
        this.setState({images: this.state.images.concat(newlist)})

    })
    // Seta o loading para false, para retirar o loading da tela e seta o id retornado do back
    this.setState({loading: false})
    this.setState({returnedID: data.id})
}

  // reseta o state dos objetos
  reset(){
    this.setState(
      { algorithm: "",
      selected: "",
      normalize: false,
      features: "",
      num_clusters: "",
      num_features: "",
      distrib_feature: "",
      view: true,
      returnedID: "",
      normalizationtype: "zscore",
      images: [],
      metrics: [{silhouette: ""}, {daviesbouldin: ""},{calinski: ""}],
      })
  }
// esse método vai mandar a requisição para o backend
  submit(){
    // pega o id da fonte de dados 
      const id = this.getDataSourceId();
    // pega tipo de gráfico, separador, normalizar do state, falta pegar o algoritmo e features  
      const {normalize, normalizationtype, features, distrib_feature, num_features, algorithm, num_clusters} = this.state
      const {indicators} = this.props.indicator
      let featuresList = []
      // esse for pega todos os indicadores selecionados anteriormente pra mandar para o back depois
        for(let i=0; i<indicators.length;i++){
            featuresList.push(indicators[i].value)
        }
      // seta o loading para true
      this.setState({loading: true})
      // Caso aconteça raramente do algoritmo escolhido estar vazio
      if (!algorithm || algorithm === ''){
        this.renderWarningMsg('Selecione um algoritmo')
        return;
      }
      // fazer a chamada da api aqui!
      const data = {algorithm, normalize, normalizationtype, features, distrib_feature, num_clusters, num_features, id, featuresList}
      api.post('train-clustering', data)
      .then(response =>{
        this.getImages(response.data, algorithm)
        })
      .catch((err) => {
        this.renderWarningMsg('Ocorreu um erro, verifique se há alguma feature incorreta: ' + err)
        this.setState({loading: false})
        console.error("Ocorreu um erro " + err);
      });
  }

// renderiza as mensagens
  renderWarningMsg = (msg) => {
    this.props.add({
      type: 'warning',
      title: 'Atenção',
      message: msg
    });
  }
// esse método manipula os selects de separador e tipo de gráfico, variando de acordo com a "variable" de entrada
  handleChangeSelects = (e, number) => {

        this.setState({normalizationtype: e.target.value})
      
  }
// esse método lida com a checkbox, alterando o state do normalize
  onChangeCheckbox = (e) => {

    this.setState({normalize: e.target.checked})
  }

// esse método lida com os inputs
  handleInputsChange = (e, variable) => {
    if (variable === 1) {
      this.setState({features: e.target.value}) }
    else if (variable === 2) {
      this.setState({num_clusters: e.target.value})
    } else if (variable === 3) {
      this.setState({num_features: e.target.value})
    } else {
      this.setState({distrib_feature: e.target.value})
    }
  }

  getPickListTemplate(item) {
    return (
      <div className="p-clearfix">
        <div style={{ fontSize: '14px', textAlign: 'right', margin: '15px 5px 0 0' }}>{item.label}</div>
      </div>
    );
  }


// esse método é o handler da dropdown de abordagem, que altera o estado da variável selected
  changeSelectOptionHandler = (event) => {
    //
    this.setState({selected: event.target.value});
    /*Seta a variável de acordo com o valor selecionado*/
  };

// esse método altera a variável view e seta o state do algoritmo selecionado
  setAlgorithmAndView = (event) => {
    if (event.target.value === 'dbscan'){
      this.setState({view: false})
    } else {
      this.setState({view: true})
    }
    this.setState({algorithm: event.target.value});
  }

  render() {
    const {returnedID, normalize, normalizationtype, algorithm, features, distrib_feature, num_features, num_clusters, images, metrics} = this.state;
    const {indicators} = this.props.indicator;
    
    let featuresList = []
      // esse for pega todos os indicadores selecionados anteriormente pra mandar pro back dps
        for(let i=0; i<indicators.length;i++){
            featuresList.push(indicators[i].value)
        }
    // verifica o que tem na variável selected, para retornar a segunda dropdown corretamente
    if (this.state.selected === "Clusterização por Particionamento") {
      type = partitioning;
    } else if (this.state.selected === "Clusterização Hierárquica") {
      type = hierarchical;
    } else if (this.state.selected === "Clusterização por Densidade") {
      type = density;
    }
    // preenche as options da dropdown do algoritmo a selecionar
    if (type) {
      options = type.map((option) => <option value={option.value}>{option.label}</option>);
    }
    return (
      <ConfigContainer size='big'>
        <PerfectScrollbar style={{ width: '100%' }}>
          <div style={{ width: '35%' }}>
            <BreadCrumb text='Voltar para Escolha de Fontes de dados' screen={ADD_TRAIN} destiny={DATASOURCE} />
          </div>
          <Header>
            <h1 style={{paddingBottom: "5px"}}>Configurar Clusterização - {'Fonte de dados: ' + this.getDataSourceContext()}</h1>
            <div style={{display: "flex"}}>
              <Button disabled={algorithm === "" || algorithm === "Escolha o algoritmo"} onClick={this.submit.bind(this)}>CLUSTERIZAR DADOS</Button>
              <Button onClick={this.reset.bind(this)}>LIMPAR DADOS</Button>
              {returnedID !== "" && (
                    /* Aqui está o botão que só aparece se tiver returnedID. Esse botão
                    baixa o excel com os dados já clusterizados*/
                    <Button style={{width: "50px"}} onClick={this.getFiles.bind()}>
                      <DownloadIcon style={{width: "30px"}}>
                      </DownloadIcon>
                    </Button>
                    
                )
              }
            </div>
          </Header>
          <Content>
            <LeftContent>
                <DialogSpan style={{color: '#000000'}}>Abordagem de Clusterização</DialogSpan>
                    <div>
                      <select style={{padding:"10px", alignContent:"center", justifyContent:"center",}} onChange={(e) => this.changeSelectOptionHandler(e)}>
                                  <option>Escolha a abordagem</option>
                                  <option>Clusterização por Particionamento</option>
                                  <option>Clusterização Hierárquica</option>
                                  <option>Clusterização por Densidade</option>
                      </select>
                      <div style={{marginTop: "5px"}}>
                        <select value={this.state.algorithm} style={{padding:"10px", alignContent:"center", justifyContent:"center",}} onChange={(e) => this.setAlgorithmAndView(e)} /*onChange={showAlgorithm}*/>
                            <option>Escolha o algoritmo</option>
                                  {
                                  /** Aqui a dropdown é preenchida de acordo com a abordagem*/
                                  options
                                  }
                        </select>
                      </div>
                    </div>

                <DialogSpan style={{color: '#000000'}}>Setar Indicadores Numéricos</DialogSpan>
                <div style={{ paddingTop: '.5vh' }}>
                <p style={{ fontWeight: 500, color: '#000000', fontSize: '12px' }}>* Os Indicadores devem estar separados por vírgulas</p>
                <DialogInput value={this.state.num_features} autoComplete="off" onChange={(e) => this.handleInputsChange(e,3)} ></DialogInput>
                </div>
                {(this.state.view === true) && (
                <div style={{paddingTop: '.5vh'}}>
                  <DialogSpan style={{color: '#000000'}}>Número de Clusters</DialogSpan>
                  <div style={{ paddingTop: '.5vh' }}>
                    <p style={{ fontWeight: 500, color: '#000000', fontSize: '12px' }}>* Não obrigatório para abordagem hierárquica</p>
                    <DialogInput type="number" min="1" oninput="this.value = this.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');" value={this.state.num_clusters} onChange={(e) => this.handleInputsChange(e,2)} ></DialogInput>
                  </div>
                </div>)}
                {/*Caso o usuário queira plotar o gráfico de barras baseado em alguma feature,
                basta digitar o nome da feature (indicador) no input text*/}
                <DialogSpan style={{color: '#000000'}}>Indicador Distribution</DialogSpan>
                <div style={{ paddingTop: '.5vh' }}>
                  <p style={{ fontWeight: 500, color: '#000000', fontSize: '12px' }}>* Opcional: indicador para o gráfico de distribuição</p>
                  <DialogInput value={this.state.distrib_feature} autoComplete="off" onChange={(e) => this.handleInputsChange(e,4)} ></DialogInput>
                </div>
                <div style={{ paddingTop: '20px', display: "flex" }}>
                  <div>
                    <p style={{ fontWeight: 500, color: '#000000', fontSize: '15px' }}>Normalizar dados</p>
                  </div>
                  <div style={{marginLeft: "5px"}}>
                    <input style={{height: "20px", width: "20px"}} type="checkbox"
                    checked={normalize}
                    onChange={(e) => this.onChangeCheckbox(e)}>
                    </input>
                  </div>
                  {normalize && (<div style={{marginLeft: "5px"}}>
                  <select style={{padding:"10px", alignContent:"center", justifyContent:"center",}}
                    value={this.state.normalizationtype}      
                    onChange={(e) => this.handleChangeSelects(e, 2)}>
                    {/*Cria as options do select*/}
                    {normtype.map((option) => (<option value={option.value}>{option.label}</option>))}
                    </select>
                  </div>)}
                </div>
                
            </LeftContent>
           
           
            <Separator style={{marginTop: "10px"}}>&nbsp;</Separator>

            <RightContainer>
              {/*Indicadores que vieram da página anterior*/}
              <StyledTitle>Indicadores Selecionados</StyledTitle>
              <div style={{marginTop: "10px", marginBottom: "15px", maxHeight: "200px", width: "325px", maxWidth: "400px", overflow: "scroll"}}>
                  <ul style={{ paddingLeft: "20px", color: "#000000"}}>
                  {featuresList.map((indicator) => (<li>{indicator}</li>))}
                  </ul>
              </div>
              <div style={{marginBottom: "20px"}}>
                <StyledTitle>Gráficos</StyledTitle>
                <StyledParagraph> {images.length === 0 ? "Sem gráficos a exibir" : "Gráficos gerados com sucesso"}</StyledParagraph>
              </div>
              <div>
                {images.map((image) => (<img src={'data:image/png;base64,' + image} alt={'clustering'} style={{ maxWidth: '1000px' }}/>))}
              </div>              
              <div>
                <div style={{display: 'inline-block'}}>
                  <StyledTitle>Métricas obtidas</StyledTitle>
                  <StyledParagraph>{metrics.silhouette == null ? "Silhouette: nenhuma métrica a exibir": "Silhouette: " + metrics.silhouette }</StyledParagraph>
                  <StyledParagraph>{metrics.daviesbouldin == null ? "Davies-Bouldin: nenhuma métrica a exibir": "Davies-Bouldin: " + metrics.daviesbouldin} </StyledParagraph>
                  <StyledParagraph>{metrics.calinski == null ? "Calinski-Harabasz: nenhuma métrica a exibir": "Calinski-Harabasz: " + metrics.calinski }</StyledParagraph>
                </div>
                {/*Só exibe as descrições das métricas após ter o ID retornado, pois tudo será executado*/}
                {this.state.returnedID !== "" && (
                  <StyledDiv>
                  <StyledTitle>Descrição das Métricas</StyledTitle>
                      <ul style={{color:"#000000"}}>
                        <li><StyledParagraph>Silhouette Index: esta métrica calcula o quão bem um elemento foi agrupado
                            em seu cluster. Os valores limitam-se entre -1 e 1, com valores 
                            próximos de -1 representando maus agrupamentos, e valores próximos de 1
                            representando bons agrupamentos.
                            </StyledParagraph></li>
                        <li><StyledParagraph> Davies-Bouldin: esta métrica utiliza a distância entre elementos e a distância
                            entre clusters. Quanto mais próximo de zero for o seu valor, melhor o agrupamento.
                          </StyledParagraph></li>
                        <li><StyledParagraph>Calinski-Harabasz: esta métrica também se utiliza da distância de elementos de 
                            um cluster para seu centroide e elementos de um cluster para o centroide de outro
                            agrupamento. Quanto maior for o valor do índice Calinski-Harabasz, mais densos 
                            e bem separados são os agrupamentos.
                          </StyledParagraph></li>
                      </ul>
                  </StyledDiv>
                )}
                {this.state.loading && (
                <div style={{display: 'inline-block', marginLeft: '180px'}}>
                  <StyledParagraph>Carregando...</StyledParagraph>
                  <ProgressSpinner style={{ width: '50px', height: '50px' }} strokeWidth="4" fill="#EEEEEE" animationDuration=".5s"></ProgressSpinner>
                </div>)}
              </div>
            </RightContainer>
          </Content>
        </PerfectScrollbar>
      </ConfigContainer>
    );
  }
}

const mapStateToProps = ({returnedID, normalize,algorithm, features, num_clusters, num_features, distrib_feature, indicator }) => ({returnedID, normalize, algorithm, features, num_clusters, num_features, distrib_feature, indicator });

export default connect(
  mapStateToProps,
  {
    ...ScreenActions, ...CourseActions,
    ...SubjectActions, ...SemesterActions,
    ...IndicatorActions, ...toastrActions,
    ...PreProcessingActions
  }
)(ClusteringPage);