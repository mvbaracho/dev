import React, { Component } from 'react';
import DropZone from 'react-dropzone';
import { DropContainer, UploadMessage } from './styles';
import api from '../../services/api';
import filesize from "filesize";

export default class Upload extends Component {
// Cria um state com todos os arquivos uploaded
  state = {
    uploadedFiles: []
  };
//Esse método manipula o upload,, obtendo os arquivos e modificando o state concatenando os arquivos
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
    // modifica o state uploadedFiles passando todos os arquivos que foram uploaded
    this.setState({
      uploadedFiles: this.state.uploadedFiles.concat(uploadedFiles)
    });
    // para cada arquivo presente em uploadedFiles, execute processUpload
    uploadedFiles.forEach(this.processUpload);
  };

  updateFile = (id, data) => {
    const newFiles = this.state.uploadedFiles.map(uploadedFile => {
      return id === uploadedFile.id
        ? { ...uploadedFile, ...data }
        : uploadedFile;
    });

    this.setState({ uploadedFiles: newFiles });

    if (this.props.onUpload) {
      this.props.onUpload(newFiles);
    }
  };

  // O método processUpload obtém o arquivo, cria um novo objeto FormData
  // para chamar a api passando o arquivo
  processUpload = uploadedFile => {
    const data = new FormData();
    // dá um append no objeto data, passando o arquivo e o nome do arquivo
    data.append("file", uploadedFile.file, uploadedFile.name);
    api
      .post("file", data, {
        onUploadProgress: e => {
          const progress = parseInt(Math.round((e.loaded * 100) / e.total));

          this.updateFile(uploadedFile.id, {
            progress
          });
        }
      }) // obtém a resposta da api
      .then(response => {
        this.updateFile(uploadedFile.id, {
          uploaded: true,
          id: response.data.id,
          url: response.data.url
        });
      })  // dá um catch caso ocorra algum erro durante o upload
      .catch(() => {
        this.updateFile(uploadedFile.id, {
          error: true
        });
      });
  };
  // esse método exibe uma mensagem de acordo com o que ocorre
  // se houver isDragReject, a mensagem é Arquivo não suportado
  renderDragMessage = (isDragActive, isDragReject) => {
    if (!isDragActive) { // recebe das props a mensagem que foi passada, vinda de DataSourceDialog
      return <UploadMessage>{this.props.message}</UploadMessage>
    }
    // isDragReject acontece caso o arquivo não seja suportado
    if (isDragReject) {
      return <UploadMessage type="error">Arquivo não suportado</UploadMessage>
    }
    // caso o Drag esteja ativo, essa mensagem aparece no container
    return <UploadMessage type="success">Solte os arquivos aqui</UploadMessage>
  }

  render() {
    return ( // Dropzone recebe a props accept, que mostra o tipo de arquivo que aceita
      // Caso o Dropzone aceite o arquivo, o handleUpload é iniciado para processar o arquivo
      <DropZone accept={this.props.accept} onDropAccepted={this.handleUpload}>
        {({ getRootProps, getInputProps, isDragActive, isDragReject }) => (
          <DropContainer
            {...getRootProps()}
            isDragActive={isDragActive}
            isDragReject={isDragReject}
          >
            <input {...getInputProps()} />
            {this.renderDragMessage(isDragActive, isDragReject)}
          </DropContainer>
        )}
      </DropZone>
    );
  }
}
