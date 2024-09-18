import React, { useState, useEffect, useRef } from "react";
import { collection, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Divider } from "primereact/divider";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { createWhatsAppLink } from "../utils/whatsappUtils";
import { useSales } from "../context/SalesContext";

const Sales = () => {
  const { sales, setSales } = useSales();
  const [selectedSale, setSelectedSale] = useState(null);
  const [isDialogVisible, setDialogVisible] = useState(false);
  const [isEditDialogVisible, setEditDialogVisible] = useState(false);
  const [isPaymentDialogVisible, setPaymentDialogVisible] = useState(false);
  const [newSaleName, setNewSaleName] = useState("");
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: "contains" },
  });
  const toast = useRef(null);

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "sales"));
        const salesData = querySnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
          saleDate: doc.data().saleDate.toDate(),
          remainingPayments: doc.data().remainingPayments || doc.data().purchaseTerms,
          paymentHistory: doc.data().paymentHistory || [], // Inicializar paymentHistory como un array vacío si no existe
          paymentDates: doc.data().paymentDates ? doc.data().paymentDates.map((date) => date.toDate()) : [],
        }));
        const sortedSales = salesData.sort((a, b) => b.saleDate - a.saleDate);
        setSales(sortedSales); // Actualizar el contexto global con las ventas
      } catch (error) {
        console.error("Error al obtener las ventas:", error);
      }
    };

    fetchSales();
  }, [setSales]);

  const handlePayment = async (sale, paymentAmount = 0) => {
    let updatedRemainingPayments;
    let newPaymentHistory;

    if (sale.purchaseTerms === -1) {
      // Cuotas flexibles: el cliente paga cualquier cantidad
      const newTotalSalePrice = sale.totalSalePrice - paymentAmount; // Resta del total
      updatedRemainingPayments = newTotalSalePrice > 0 ? newTotalSalePrice : 0;

      // Actualizar el historial de pagos con el nuevo pago
      newPaymentHistory = sale.paymentHistory ? [...sale.paymentHistory, paymentAmount] : [paymentAmount];
    } else {
      // Cuotas fijas
      updatedRemainingPayments = sale.remainingPayments - 1;
      newPaymentHistory = sale.paymentHistory ? [...sale.paymentHistory, sale.termAmount] : [sale.termAmount];
    }

    const currentPaymentDate = new Date();

    try {
      const saleRef = doc(db, "sales", sale.id);
      await updateDoc(saleRef, {
        remainingPayments: updatedRemainingPayments,
        paymentDates: [...sale.paymentDates, currentPaymentDate],
        paymentHistory: newPaymentHistory, // Guardar el historial de pagos actualizado
      });

      // Actualizar el contexto global con las ventas actualizadas
      setSales(
        sales.map((s) =>
          s.id === sale.id
            ? {
                ...s,
                remainingPayments: updatedRemainingPayments,
                paymentDates: [...s.paymentDates, currentPaymentDate],
                paymentHistory: newPaymentHistory, // Actualizar el historial localmente
              }
            : s
        )
      );

      toast.current.show({
        severity: "success",
        summary: "Éxito",
        detail:
          sale.purchaseTerms === -1
            ? `Pago de ${paymentAmount} registrado. Restante: ${updatedRemainingPayments}`
            : `Pago de cuota registrado. Quedan ${updatedRemainingPayments} cuotas`,
        life: 3000,
      });

      const whatsappLink = createWhatsAppLink(sale, updatedRemainingPayments);
      window.open(whatsappLink, "_blank");
    } catch (error) {
      console.error("Error al registrar el pago:", error);
      toast.current.show({ severity: "error", summary: "Error", detail: "Error al registrar el pago", life: 3000 });
    }
  };

  const deleteSale = async (sale) => {
    try {
      await deleteDoc(doc(db, "sales", sale.id));
      setSales(sales.filter((s) => s.id !== sale.id));
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

  const handleEditSale = (sale) => {
    setSelectedSale(sale);
    setNewSaleName(sale.buyerName);
    setEditDialogVisible(true);
  };

  const updateSaleName = async () => {
    try {
      const saleRef = doc(db, "sales", selectedSale.id);
      await updateDoc(saleRef, {
        buyerName: newSaleName,
      });

      setSales(sales.map((s) => (s.id === selectedSale.id ? { ...s, buyerName: newSaleName } : s)));

      toast.current.show({
        severity: "success",
        summary: "Éxito",
        detail: "Nombre del comprador actualizado correctamente",
        life: 3000,
      });

      setEditDialogVisible(false);
    } catch (error) {
      console.error("Error al actualizar el nombre del comprador:", error);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo actualizar el nombre del comprador",
        life: 3000,
      });
    }
  };

  const paymentButton = (sale) => (
    <Button
      label="Pago"
      icon="pi pi-check"
      className="p-button-success mr-2"
      disabled={sale.remainingPayments <= 0 && sale.purchaseTerms !== -1}
      onClick={() => {
        setSelectedSale(sale);
        if (sale.purchaseTerms === -1) {
          setPaymentDialogVisible(true);
        } else {
          handlePayment(sale);
        }
      }}
    />
  );

  const deleteButton = (sale) => (
    <Button label="Eliminar" icon="pi pi-trash" className="p-button-danger mt-1" onClick={() => confirmDeleteSale(sale)} />
  );

  const editButton = (sale) => (
    <Button label="Editar" icon="pi pi-pencil" className="p-button-warning mt-1" onClick={() => handleEditSale(sale)} />
  );

  const actionBodyTemplate = (sale) => (
    <>
      {paymentButton(sale)}
      {editButton(sale)}
      {deleteButton(sale)}
    </>
  );

  const paymentDatesTemplate = (rowData) => (
    <>
      {rowData.paymentDates.map((date, index) => (
        <p key={index}>{new Date(date).toLocaleDateString()}</p>
      ))}
    </>
  );

  const saleDateTemplate = (rowData) => new Date(rowData.saleDate).toLocaleDateString();
  const salePriceTemplate = (rowData) => `$${parseFloat(rowData.totalSalePrice).toFixed(2)}`;

  const purchaseTermsTemplate = (rowData) => {
    return rowData.purchaseTerms === -1 ? "N/A" : `${rowData.remainingPayments}/${rowData.purchaseTerms}`;
  };

  const remainingAmountTemplate = (rowData) => {
    const totalSalePrice = parseFloat(rowData.totalSalePrice) || 0;
    const totalPaid = rowData.paymentHistory.reduce((acc, payment) => acc + parseFloat(payment), 0);
    const remainingAmount = totalSalePrice - totalPaid;
    return rowData.purchaseTerms === -1 ? `$${remainingAmount.toFixed(2)}` : null;
  };

  const onGlobalFilterChange = (e) => {
    const value = e.target.value;
    let _filters = { ...filters };
    _filters["global"].value = value;
    setFilters(_filters);
    setGlobalFilterValue(value);
  };

  const renderHeader = () => {
    return (
      <div className="table-header">
        <span className="p-input-icon-right">
          <InputText
            value={globalFilterValue}
            onChange={onGlobalFilterChange}
            placeholder="Buscar por nombre o tipo"
            style={{ width: "250px" }}
          />
        </span>
      </div>
    );
  };

  const paymentDialogFooter = (
    <>
      <Button label="Cancelar" icon="pi pi-times" onClick={() => setPaymentDialogVisible(false)} className="p-button-text" />
      <Button
        label="Pagar"
        icon="pi pi-check"
        onClick={() => {
          handlePayment(selectedSale, paymentAmount);
          setPaymentDialogVisible(false);
        }}
      />
    </>
  );

  return (
    <div className="container mx-auto mt-6">
      <Toast ref={toast} />

      <Dialog
        visible={isEditDialogVisible}
        style={{ width: "450px" }}
        header="Editar Venta"
        modal
        onHide={() => setEditDialogVisible(false)}
        footer={
          <>
            <Button label="Cancelar" icon="pi pi-times" onClick={() => setEditDialogVisible(false)} className="p-button-text" />
            <Button label="Guardar" icon="pi pi-check" onClick={updateSaleName} />
          </>
        }
      >
        <div className="p-field">
          <label htmlFor="saleName">Nombre del comprador</label>
          <InputText id="saleName" value={newSaleName} onChange={(e) => setNewSaleName(e.target.value)} style={{ width: "100%" }} />
        </div>
      </Dialog>

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

      <Dialog
        header="Pagar cuota flexible"
        visible={isPaymentDialogVisible}
        style={{ width: "450px" }}
        footer={paymentDialogFooter}
        onHide={() => setPaymentDialogVisible(false)}
      >
        <div className="p-field">
          <label htmlFor="paymentAmount">Monto del pago</label>
          <InputText
            id="paymentAmount"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(parseFloat(e.target.value))}
            placeholder="Ingresa el monto del pago"
          />
        </div>
      </Dialog>

      <div className="p-grid">
        <div className="p-col-12">
          <Card>
            <h2 className="text-center">Ventas</h2>
            <Divider />

            <DataTable
              value={sales}
              responsiveLayout="scroll"
              style={{ marginTop: "20px" }}
              rowsPerPageOptions={[5, 10, 25, 50]}
              rows={10}
              paginator
              filters={filters}
              globalFilterFields={["buyerName", "items"]}
              header={renderHeader()}
            >
              <Column field="items" header="Artículos"></Column>
              <Column field="buyerName" header="Cliente" sortable></Column>
              <Column field="totalPurchasePrice" header="P.Compra" body={salePriceTemplate} />
              <Column field="totalSalePrice" header="P.Venta" body={salePriceTemplate} />
              <Column field="remainingPayments" header="Cuotas" body={purchaseTermsTemplate} />
              {/* Mostrar monto restante solo si es cuota flexible */}
              <Column
                field="remainingPayments"
                header="Monto Restante"
                body={remainingAmountTemplate}
                style={{ display: sales.some((sale) => sale.purchaseTerms === -1) ? "table-cell" : "none" }}
              />
              <Column field="saleDate" header="Fecha de Ingreso" body={saleDateTemplate} />
              <Column field="paymentDates" header="Fechas de Pago" body={paymentDatesTemplate} sortable />
              <Column body={actionBodyTemplate} header="Acciones"></Column>
            </DataTable>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Sales;
