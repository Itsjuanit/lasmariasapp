import React from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";

const EditSaleDialog = ({ visible, onHide, selectedSale, newSaleName, setNewSaleName, updateSaleName }) => {
  return (
    <Dialog
      visible={visible}
      style={{ width: "450px" }}
      header="Editar Venta"
      modal
      onHide={onHide}
      footer={
        <>
          <Button label="Cancelar" icon="pi pi-times" onClick={onHide} className="p-button-text" />
          <Button label="Guardar" icon="pi pi-check" onClick={updateSaleName} />
        </>
      }
    >
      <div className="p-field">
        <label htmlFor="saleName">Nombre del comprador</label>
        <InputText id="saleName" value={newSaleName} onChange={(e) => setNewSaleName(e.target.value)} style={{ width: "100%" }} />
      </div>
    </Dialog>
  );
};

export default EditSaleDialog;
