import React from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";

const PaymentDialog = ({ visible, onHide, selectedSale, paymentAmount, setPaymentAmount, handlePayment }) => {
  const isFlexiblePayment = selectedSale?.purchaseTerms === -1;

  return (
    <Dialog
      header={isFlexiblePayment ? "Pagar cuota flexible" : "Registrar Pago"}
      visible={visible}
      style={{ width: "450px" }}
      footer={
        <>
          <Button label="Cancelar" icon="pi pi-times" onClick={onHide} className="p-button-text" />
          <Button
            label="Pagar"
            icon="pi pi-check"
            onClick={() => {
              handlePayment(selectedSale, paymentAmount);
              onHide();
            }}
          />
        </>
      }
      onHide={onHide}
    >
      {isFlexiblePayment && (
        <div className="p-field">
          <label htmlFor="paymentAmount">Monto del pago</label>
          <InputText
            id="paymentAmount"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(parseFloat(e.target.value))}
            placeholder="Ingresa el monto del pago"
          />
        </div>
      )}
      {!isFlexiblePayment && <p>¿Deseas registrar el pago de la cuota?</p>}
    </Dialog>
  );
};

export default PaymentDialog;
