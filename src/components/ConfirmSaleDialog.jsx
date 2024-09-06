import React from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Accordion, AccordionTab } from "primereact/accordion"; // Asegúrate de que estás usando estos módulos correctamente

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
  selectedJoyas, // Recibimos las joyas seleccionadas
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

      {/* Accordion para mostrar los artículos seleccionados */}
      <div className="p-field mt-2">
        <Accordion activeIndex={0}>
          <AccordionTab header="Artículos seleccionados para vender">
            {selectedJoyas && selectedJoyas.length > 0 ? (
              <ul>
                {selectedJoyas.map((joya, index) => (
                  <li key={index}>
                    <strong>Art:</strong> {joya.name} | <strong>P.Venta:</strong> {joya.salePrice}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No hay artículos seleccionados.</p>
            )}
          </AccordionTab>
        </Accordion>
      </div>

      <div className="p-field">
        <Button label="Cancelar" severity="danger" icon="pi pi-times" className="p-button-text mb-2 mt-2" onClick={onHide} />
        <Button label="Confirmar" severity="success" icon="pi pi-check" className="p-button-text" onClick={handleConfirmSale} />
      </div>
    </Dialog>
  );
};

export default ConfirmSaleDialog;
