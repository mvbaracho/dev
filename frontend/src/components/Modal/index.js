import React, { useState } from "react";
//import "./styles.css";
import Select from '../DropDown/Dropdown'
import Button from '../../styles/Button';
import Dialog from '../Dialog';
import {
    DialogForm, DialogFormButtonContainer,
    DialogInput, DialogSpan
  } from '../../styles/global';

export default function Modal() {
  const [modal, setModal] = useState(false);

  const toggleModal = () => {
    setModal(!modal);
  };

  if(modal) {
    document.body.classList.add('active-modal')
  } else {
    document.body.classList.remove('active-modal')
  }

  return (
    <>{/*}
      <button onClick={toggleModal} /*className="btn-modal">
        Open
         </button> */}

      {modal && (
        <Dialog>
            <DialogForm>
            {/*<div /*className="modal"*>*/}
            {/*<div onClick={toggleModal} /*className="overlay">*/}
            {/*<div /*className="modal-content">*/}
                <h1>Configurações de Clustering</h1>
                <DialogSpan>Digite as features a ignorar:</DialogSpan>
                <DialogInput
                    //value=""
                    autoComplete="off"
                    //onChange={this.handleChangeInput}
                    /*</div>name="name"*/ >
                </DialogInput>
                <Select></Select>
                <DialogFormButtonContainer>
                    <Button /*onClick={this.submit.bind(this)*/ >Clusterizar</Button>
                    <Button style={{ marginLeft: '1vw' }} color="gray" isCancel={true} className="close-modal" onClick={toggleModal}>Cancelar</Button>
                </DialogFormButtonContainer>
                {/*<button className="close-modal" onClick={toggleModal}>
                CLOSE
                </button>*/}
            {/*</div>*/}
            {/*</div>*/}
            </DialogForm>
        </Dialog>
      )}
    </>
  );
}