import React, { Component } from 'react';
import {
  DialogForm, DialogFormButtonContainer,
  DialogInput, DialogSpan
} from '../../styles/global';
import { Creators as DialogActions } from '../../store/ducks/dialog';
import { Creators as DataSourceActions } from '../../store/ducks/data_source';
import { connect } from 'react-redux';
import Dialog from '../Dialog';
import Button from '../../styles/Button';
import { actions as toastrActions } from 'react-redux-toastr';
import Upload from '../Upload';
import UploadFileList from '../UploadFileList';
import api from '../../services/api';

class DataSourceDialog extends Component {

  // Seta o state dos dados, nesse caso recebendo nome do arquivo e uma lista de arquivos
  state = {
    name: '',
    uploadedFiles: []
  };
// Esse método fecha a pop-up e reseta o state da classe upload
  onClose = () => {
    this.props.setDialog('dataSource');
    this.setState({ name: '', uploadedFiles: [] });
  }

  // esse método acontece quando se clica em "Cancelar"
  onCancel = () => {
    const { uploadedFiles } = this.state;

    uploadedFiles.forEach(file => this.handleDelete(file.id));

    this.onClose();
  }

  // Esse método chama a api de fato, passando o arquivo a ser deletado
  handleDelete = async id => {
    await api.delete(`file/${id}`);

    this.setState({
      uploadedFiles: this.state.uploadedFiles.filter(file => file.id !== id)
    });
  };

  // Esse método exibe uma mensagem de warning, caso algo de errado aconteça
  renderWarningMsg = (msg) => {
    this.props.add({
      type: 'warning',
      title: 'Atenção',
      message: msg
    });
  }
// Lida com o input, modificando-o
  handleChangeInput = e => this.setState({ [e.target.name]: e.target.value });

  // Submit faz a ação de "Salvar" os arquivos uploaded
  submit = () => {
    const { name, uploadedFiles } = this.state;
    const fileId = uploadedFiles.map(file => file.id);
// verifica se não possui nome
    if (!name) {
      this.renderWarningMsg('Nome não informado');
      return;
    }
// Verifica se existe algum arquivo uploaded
    if (!uploadedFiles.length) {
      this.renderWarningMsg('Nenhum arquivo importado');
      return;
    }

    this.props.postDataSource({ name, file_id: fileId[0] });
    this.onClose();
  }

  render() {
    const { name, uploadedFiles } = this.state;
    const { dataSource } = this.props.dialog;

    // 
    if (!dataSource) {
      return null;
    }
    // a partir daqui começa a exibir as informações e usar os métodos criados
    return (
      <Dialog>
        <DialogForm>
          <h1>Adicionar Fonte de Dados</h1>
          {/* aqui tem-se um span com um input dentro */}
          <DialogSpan>Fonte de dados:</DialogSpan>
          <DialogInput
            value={name}
            autoComplete="off"
            onChange={this.handleChangeInput}
            name="name">
          </DialogInput>
          {/* Exibe essa parte da tela, caso nenhum arquivo tenha sido uploaded*/}
          {!uploadedFiles.length && (
            <div style={{ paddingTop: '2vh' }}>
              <div style={{ paddingBottom: '.5vh' }}><DialogSpan>Arquivo:</DialogSpan></div>
              {/* Chama o componente upload aqui, passando 3 parâmetros (3 props)
              passa os uploadedFiles, o tipo de aceitação = csv e uma mensagem}*/}
              <Upload
                onUpload={(uploadedFiles) => this.setState({ uploadedFiles })}
                accept="text/csv"
                message="Arraste um arquivo CSV ou clique aqui."
              />
            </div>)}
          {/* Chama o componente uploadedFilesList se tiver algum arquivo
          uploaded. Passa dois props para a UploadFIleList: os arquivos e uma função
          para modificar o estado caso se delete um arquivo*/}
          {!!uploadedFiles.length && (
            <UploadFileList
              files={uploadedFiles}
              onDelete={(uploadedFiles) => this.setState({ uploadedFiles })} />
          )}
          {/* Exibe normalmente essa parte da tela*/}
          {!uploadedFiles.length && (
            <div style={{ paddingTop: '.5vh' }}>
              <h2 style={{ fontWeight: 500 }}>* Arquivo deve estar separado por vírgulas</h2>
              <h2 style={{ fontWeight: 500 }}>* Primeira linha deve ser o cabeçalho</h2>
              <h2 style={{ fontWeight: 500 }}>* As variáveis alvo devem ser numéricas</h2>
            </div>
          )}
          {/* Essa é a parte de baixo da tela, que contém os botões de cancelar e salvar
          O botão de Salvar chama a ação submit. O botão cancelar chama a ação onCancel*/}
          <DialogFormButtonContainer>
            <Button onClick={this.submit.bind(this)}>Salvar</Button>
            <Button style={{ marginLeft: '1vw' }} color="gray" isCancel={true} onClick={this.onCancel}>Cancelar</Button>
          </DialogFormButtonContainer>

        </DialogForm>
      </Dialog>
    )
  }
}

const mapStateToProps = ({ dialog }) => ({ dialog });

export default connect(
  mapStateToProps,
  {
    ...DialogActions, ...toastrActions,
    ...DataSourceActions
  }
)(DataSourceDialog);