import React, { useState, useEffect, useRef } from "react";
import { collection, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Calendar } from "primereact/calendar";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Divider } from "primereact/divider";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedSale, setSelectedSale] = useState(null);
  const [isDialogVisible, setDialogVisible] = useState(false);
  const toast = useRef(null);

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "sales"));
        const salesData = querySnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
          saleDate: doc.data().saleDate.toDate(), // Fecha de ingreso de la venta
          remainingPayments: doc.data().remainingPayments || doc.data().purchaseTerms,
          paymentDates: doc.data().paymentDates || [],
        }));
        setSales(salesData);
      } catch (error) {
        console.error("Error al obtener las ventas:", error);
      }
    };

    fetchSales();
  }, []);

  const filterSalesByDate = () => {
    if (startDate && endDate) {
      const filtered = sales.filter((sale) => sale.saleDate >= startDate && sale.saleDate <= endDate);
      setFilteredSales(filtered);
    } else {
      setFilteredSales(sales);
    }
  };

  const handlePayment = async (sale) => {
    const remainingPayments = sale.remainingPayments - 1;
    const currentPaymentDate = new Date();

    try {
      const saleRef = doc(db, "sales", sale.id);
      await updateDoc(saleRef, {
        remainingPayments: remainingPayments > 0 ? remainingPayments : 0,
        paymentDates: [...sale.paymentDates, currentPaymentDate],
      });

      setSales(
        sales.map((s) => (s.id === sale.id ? { ...s, remainingPayments, paymentDates: [...s.paymentDates, currentPaymentDate] } : s))
      );

      toast.current.show({
        severity: "success",
        summary: "Éxito",
        detail: `Pago de cuota registrado. Quedan ${remainingPayments} plazos`,
        life: 3000,
      });
    } catch (error) {
      console.error("Error al registrar el pago:", error);
      toast.current.show({ severity: "error", summary: "Error", detail: "Error al registrar el pago", life: 3000 });
    }
  };

  const deleteSale = async (sale) => {
    try {
      await deleteDoc(doc(db, "sales", sale.id));
      setSales(sales.filter((s) => s.id !== sale.id));
      setFilteredSales(filteredSales.filter((s) => s.id !== sale.id));
      setDialogVisible(false);

      toast.current.show({ severity: "success", summary: "Éxito", detail: "Venta eliminada correctamente", life: 3000 });
    } catch (error) {
      console.error("Error al eliminar la venta:", error);
    }
  };

  const confirmDeleteSale = (sale) => {
    setSelectedSale(sale);
    setDialogVisible(true);
  };

  const paymentButton = (sale) => (
    <Button
      label="Registrar Pago"
      icon="pi pi-check"
      className="p-button-success mr-2"
      disabled={sale.remainingPayments <= 0}
      onClick={() => handlePayment(sale)}
    />
  );

  const deleteButton = (sale) => (
    <Button label="Eliminar" icon="pi pi-trash" className="p-button-danger" onClick={() => confirmDeleteSale(sale)} />
  );

  const actionBodyTemplate = (sale) => (
    <>
      {paymentButton(sale)}
      {deleteButton(sale)}
    </>
  );

  const paymentDatesTemplate = (rowData) => {
    return (
      <>
        {rowData.paymentDates.map((date, index) => (
          <p key={index}>{new Date(date).toLocaleDateString()}</p>
        ))}
      </>
    );
  };

  const purchasePriceTemplate = (rowData) => {
    return rowData.items.length > 1 ? "N/A" : rowData.totalPurchasePrice;
  };

  const saleDateTemplate = (rowData) => {
    return new Date(rowData.saleDate).toLocaleDateString(); // Mostrar la fecha de ingreso de la venta
  };

  return (
    <div className="container mx-auto mt-6">
      <Toast ref={toast} />
      <Dialog
        visible={isDialogVisible}
        style={{ width: "350px" }}
        header="Confirmar eliminación"
        modal
        footer={
          <div>
            <Button label="No" icon="pi pi-times" onClick={() => setDialogVisible(false)} className="p-button-text" />
            <Button label="Sí" icon="pi pi-check" onClick={() => deleteSale(selectedSale)} autoFocus />
          </div>
        }
        onHide={() => setDialogVisible(false)}
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

      <div className="p-grid">
        <div className="p-col-12">
          <Card>
            <h4 className="text-center">Ventas</h4>
            <Divider />

            <div className="p-grid p-align-center p-justify-between p-mb-4">
              <div className="p-col-12 p-md-6">
                <Calendar value={startDate} onChange={(e) => setStartDate(e.value)} placeholder="Fecha Inicio" className="mb-2" showIcon />
              </div>
              <div className="p-col-12 p-md-6">
                <Calendar value={endDate} onChange={(e) => setEndDate(e.value)} placeholder="Fecha Fin" className="mb-2" showIcon />
              </div>
            </div>

            <Button label="Buscar" onClick={filterSalesByDate} className="p-mb-4" />

            <DataTable value={filteredSales.length > 0 ? filteredSales : sales} responsiveLayout="scroll" style={{ marginTop: "20px" }}>
              <Column field="items" header="Artículos"></Column>
              <Column field="buyerName" header="Cliente"></Column>
              <Column field="totalPurchasePrice" header="P.Compra" body={purchasePriceTemplate} />
              <Column field="totalSalePrice" header="P.Venta"></Column>
              <Column field="remainingPayments" header="Cuotas" body={(data) => `${data.remainingPayments}/${data.purchaseTerms}`} />
              <Column field="saleDate" header="Fecha de Ingreso" body={saleDateTemplate} />
              <Column field="paymentDates" header="Fechas de Pago" body={paymentDatesTemplate} />
              <Column body={actionBodyTemplate} header="Acciones"></Column>
            </DataTable>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Sales;
