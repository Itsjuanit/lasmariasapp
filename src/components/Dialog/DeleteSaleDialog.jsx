import React from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";

const DeleteSaleDialog = ({ visible, onHide, selectedSale, deleteSale }) => {
  return (
    <Dialog
      visible={visible}
      style={{ width: "350px" }}
      header="Confirmar eliminación"
      modal
      footer={
        <>
          <Button label="No" icon="pi pi-times" onClick={onHide} className="p-button-text" />
          <Button label="Sí" icon="pi pi-check" onClick={() => deleteSale(selectedSale)} autoFocus />
        </>
      }
      onHide={onHide}
    >
      <div className="confirmation-content">
        <i className="pi pi-exclamation-triangle p-mr-3" style={{ fontSize: "2rem" }} />
        {selectedSale && (
          <span>
            ¿Estás seguro de que deseas eliminar la venta de <b>{selectedSale.items}</b>?
          </span>
        )}
      </div>
    </Dialog>
  );
};

export default DeleteSaleDialog;
