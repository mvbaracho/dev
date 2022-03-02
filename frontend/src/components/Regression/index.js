import React, { Component } from 'react';
import {
  Header
} from '../../styles/global';
import { connect } from 'react-redux';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { ConfigContainer } from '../../styles/ConfigContainer';
import Button from '../../styles/Button';
import DropZone from 'react-dropzone';
import { DropContainer, UploadMessage } from '../../components/Upload/styles';
import filesize from "filesize";
import UploadFileList from '../UploadFileList';
import api from '../../services/api';
import { CsvToHtmlTable } from 'react-csv-to-table';
import { CenterContainer } from '../../components/Chart/styles';
import { ProgressSpinner } from 'primereact/progressspinner';
import { primaryColor } from '../../styles/global';
import {
  DialogInput, DialogSpan
} from '../../styles/global';
import { RadioGroup, RadioButton } from 'react-radio-buttons';
class Regression extends Component {

  state = {
    name: '',
    uploadedFiles: [],
    file: '',
    sep: '',
    target: '',
    trainSize: 0,
    submitPost: false,
    progressTrain: 0,
    idExec: '',
    error: '',
    imagesResults: {
      cooks: '',
      error: '',
      learning_curve: '',
      real_predict: '',
      residuals: ''
    },
    top_five: '',
    score_grid: '',
    best_model: '',
    zip_file: '',
    result_df: '',
    metrics: false
  };

  handleUpload = files => {
    const uploadedFiles = files.map(file => ({
      file,
      id: null,
      name: file.name,
      readableSize: filesize(file.size),
      preview: URL.createObjectURL(file),
      progress: 0,
      uploaded: false,
      error: false,
      url: null
    }));

    this.setState({
      uploadedFiles: this.state.uploadedFiles.concat(uploadedFiles)
    });

    uploadedFiles.forEach(this.processUpload);
  };

  processUpload = uploadedFile => {
    this.setState({ file: uploadedFile});
  };

  renderDragMessage = (isDragActive, isDragReject) => {
    if (!isDragActive) {
      return <UploadMessage class="mb-0">{'Arraste um arquivo CSV ou clique aqui.'}</UploadMessage>
    }

    if (isDragReject) {
      return <UploadMessage type="error">Arquivo não suportado</UploadMessage>
    }

    return <UploadMessage type="success">Solte os arquivos aqui</UploadMessage>
  }
  
  sepChange = (e) => {
    this.setState({ sep: e});
  };
  
  targetChange = (e) => {
    this.setState({ target: e.target.value });
  };

  trainSizeChange = (e) => {
    this.setState({ trainSize: e.target.value });
  };

  progressChange = (e) => {
    this.setState({ progressTrain: e });
  };

  submit = () => {
    const { file, trainSize, target, sep } = this.state;
    const data = new FormData();
    data.append("file", file.file, file.name);
    data.append("separator", sep);
    data.append("train", trainSize);
    data.append("target", target)
    this.setState({ submitPost: true });
    
     api
      .post("train-regression", data)
      .then(response => {
       this.setState({idExec: response.data.id})
      })
      .catch((error) => {
        this.setState({error: 'Ocorreu um erro, tente novamente!'})
        this.setState({submitPost: false})
      });

  }

  getResults = () => {
    const {idExec} = this.state
    api
    .get(("best-parameters-model/"+idExec))
    .then(response => {
      this.setState({best_model: response.data})      
    })
    .catch(() => {
      this.setState({error: 'Ocorreu um erro, tente novamente!'})
      this.setState({submitPost: false})
    });

    api
    .get(("rmse/"+idExec))
    .then(response => {
      this.setState({rmse: response.data})      
    })
    .catch(() => {
      this.setState({error: 'Ocorreu um erro, tente novamente!'})
      this.setState({submitPost: false})
    });

    api
      .get(("images-regression/"+idExec))
      .then(response => {
        this.setState({imagesResults: response.data})
      })
      .catch(() => {
        this.setState({error: 'Ocorreu um erro, tente novamente!'})
        this.setState({submitPost: false})
      });

    api
    .get(("top-five/"+idExec))
    .then(response => {
      this.setState({top_five: response.data})      
    })
    .catch(() => {
      this.setState({error: 'Ocorreu um erro, tente novamente!'})
      this.setState({submitPost: false})
    });

    api
    .get(("result/"+idExec))
    .then(response => {
      this.setState({result_df: response.data})      
    })
    .catch(() => {
      this.setState({error: 'Ocorreu um erro, tente novamente!'})
      this.setState({submitPost: false})
    });

    this.setState({metrics: true})
  }

  download_files = () => {
    const {idExec} = this.state
    api
    .get(("files-download/"+idExec), { headers: { 'Content-Type': 'application/zip' }})
    .then(response => {
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      const extension = 'zip';
    
      link.href = url;
      link.setAttribute('download', `${idExec}.${extension}`);
      document.body.appendChild(link);
      link.click();      
    })
    .catch(() => {
      this.setState({error: 'Ocorreu um erro, tente novamente!'})
      this.setState({submitPost: false})
    });
  }

  render(){ 
    
    const { name, uploadedFiles, submitPost, idExec, metrics, imagesResults, top_five, best_model, rmse } = this.state;
    return (
      <PerfectScrollbar style={{ width: '100%', overflowX: 'auto' }}>
          <ConfigContainer  size='big' style={{ color: '#000' , paddingLeft: '20px'}}>
            <Header>
              <h1>Analise de Regressão de dados</h1>
            </Header>
            {!submitPost && (
              <div>
                <h4 class="ps-4">
                  Adicione o csv com os dados:
                </h4>
              {!uploadedFiles.length && (
                <div class="d-block ps-4 pb-2 pt-2 pe-4">
                  <div class="pb-2">
                    <span>* Primeira linha deve ser o cabeçalho</span>
                    <br/>
                    <span>* As variáveis alvo devem ser numéricas</span>
                  </div>
                  <DropZone accept={"text/csv"} onDropAccepted={this.handleUpload}>
                    {({ getRootProps, getInputProps, isDragActive, isDragReject }) => (
                      <DropContainer
                        {...getRootProps()}
                        isDragActive={isDragActive}
                        isDragReject={isDragReject}
                      >
                        <input {...getInputProps()} />
                        {this.renderDragMessage(isDragActive, isDragReject)}
                      </DropContainer>)}
                  </DropZone>
                </div>
              )}
              {!!uploadedFiles.length && (
                <UploadFileList
                  dontShow={true}
                  files={uploadedFiles}
                  onDelete={(uploadedFiles) => this.setState({ uploadedFiles })} />
              )}
              <div class='d-flex flex-column ps-4'>
                <DialogSpan>Separador?</DialogSpan>
                <div style={{width: '30%'}}>
                  <RadioGroup onChange={this.sepChange} horizontal>
                    <RadioButton value=",">
                      <text style={{color: 'black', fontWeight: 'bold'}}>,</text>
                    </RadioButton>
                    <RadioButton value=";">
                      <text style={{color: 'black', fontWeight: 'bold'}}>;</text>
                    </RadioButton>
                    <RadioButton value=" ">
                      <text style={{color: 'black', fontWeight: 'bold'}}>Espaço</text>
                    </RadioButton>
                  </RadioGroup>
                </div>
              </div>
              <div class='d-flex flex-column ps-4'>
                <DialogSpan>Coluna alvo?</DialogSpan>
                <DialogInput
                  style={{maxWidth: '300px'}}
                  value={this.state.target}
                  onChange={this.targetChange}>
                </DialogInput>
              </div>
              <div class='d-flex flex-column ps-4'>
                <DialogSpan>Quantidade para Treinamento?</DialogSpan>
                <DialogInput
                  style={{maxWidth: '300px'}}
                  type={'number'}
                  max={"100"}
                  value={this.state.trainSize}
                  onChange={this.trainSizeChange}>
                </DialogInput>
              </div>
              <div class="p-4">
                <Button onClick={this.submit.bind(this)}>Executar Regressão</Button>
              </div>
            </div> )}
            {(submitPost && !idExec &&
            <CenterContainer color={primaryColor}>
              <ProgressSpinner style={{ width: '50px', height: '50px' }} strokeWidth="4" fill="#EEEEEE" animationDuration=".5s" />
            </CenterContainer>)}
            {idExec && !metrics && (<CenterContainer>
              <Button onClick={this.getResults.bind(this)}>Visualizar resultados e métricas</Button>
            </CenterContainer>)}
            { metrics && (
              <div>
                <div class="pb-2 ps-4 pe-4 pt-2 justify-content-center">
                  <h2>Comparação entre melhores modelos</h2>
                  <CsvToHtmlTable data={top_five} csvDelimiter=";" hasHeader={true} tableClassName="table table-striped table-hover"/>
                </div>
                <div class="ps-4 pb-2 pe-4 mb-2">
                  <h2 class="pb-2">Melhor modelo e parametros utilizados</h2>
                  <text>{best_model}</text>
                </div>
                <div class="ps-4 pb-2 pe-4 mb-2">
                  <h2 class="pb-2">RMSE do melhor modelo</h2>
                  <text>{rmse}</text>
                </div>
                <div class="container ps-4 pt-2">
                  <div class="row">
                    <div class="col">
                      <h2>Real x Previsto</h2>
                      <img src={'data:image/png;base64,' + imagesResults.real_predict} alt={'real_x_predict'} style={{ maxWidth: '500px' }}/>
                    </div>
                    <div class="col">
                      <h2>Erro</h2>
                      <img src={'data:image/png;base64,' + imagesResults.error} alt={'error'} style={{ maxWidth: '500px' }}/>
                    </div>
                  </div>
                  <div class="row">
                    <div class="col">
                      <h2>Curva de aprendizado</h2>
                      <img src={'data:image/png;base64,' + imagesResults.learning_curve} alt={'teste'} style={{ maxWidth: '500px' }}/>
                    </div>
                    <div class="col">
                      <h2>Residuos</h2>
                      <img src={'data:image/png;base64,' + imagesResults.residuals} alt={'residuals'} style={{ maxWidth: '500px' }}/>
                    </div>
                  </div>
                  <div class="row">
                    <h2>Cooks</h2>
                    <img src={'data:image/png;base64,' + imagesResults.cooks} alt={'cooks'} style={{ maxWidth: '500px' }}/>
                  </div>
                </div>
              </div>
            )}
          </ConfigContainer>
      </PerfectScrollbar>        
    )
  }
}

const mapStateToProps = ({ dialog }) => ({ dialog });
export default connect(mapStateToProps,
  {
  })(Regression);