import React from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";

const ConfirmSaleDialog = ({
  visible,
  onHide,
  buyerName,
  setBuyerName,
  buyerPhone,
  setBuyerPhone,
  purchaseTerms,
  setPurchaseTerms,
  termOptions,
  handleConfirmSale,
}) => {
  return (
    <Dialog visible={visible} style={{ width: "450px" }} header="Confirmar Venta" modal className="p-fluid" onHide={onHide}>
      <div className="p-field">
        <label htmlFor="buyerName">Nombre del Comprador</label>
        <InputText id="buyerName" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} />
      </div>
      <div className="p-field">
        <label htmlFor="buyerPhone">Número de Celular</label>
        <InputText id="buyerPhone" value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} />
      </div>
      <div className="p-field">
        <label htmlFor="purchaseTerms">Cuotas</label>
        <Dropdown
          value={purchaseTerms}
          options={termOptions}
          onChange={(e) => setPurchaseTerms(e.value)}
          placeholder="Selecciona el número de cuotas"
        />
      </div>
      <div className="p-field">
        <Button label="Cancelar" severity="danger" icon="pi pi-times" className="p-button-text mb-2 mt-2" onClick={onHide} />
        <Button label="Confirmar" severity="success" icon="pi pi-check" className="p-button-text" onClick={handleConfirmSale} />
      </div>
    </Dialog>
  );
};

export default ConfirmSaleDialog;
