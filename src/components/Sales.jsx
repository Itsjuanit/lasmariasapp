import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { collection, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Divider } from "primereact/divider";
import { Toast } from "primereact/toast";
import { InputText } from "primereact/inputtext";
import { TabView, TabPanel } from "primereact/tabview";
import { createWhatsAppLink } from "../utils/whatsappUtils";
import { useSales } from "../context/SalesContext";
import EditSaleDialog from "./Dialog/EditSaleDialog";
import DeleteSaleDialog from "./Dialog/DeleteSaleDialog";
import PaymentDialog from "./Dialog/PaymentDialog";

const Sales = () => {
  const { sales, setSales } = useSales();
  const [dialogState, setDialogState] = useState({
    isDialogVisible: false,
    isEditDialogVisible: false,
    isPaymentDialogVisible: false,
    selectedSale: null,
  });
  const [newSaleName, setNewSaleName] = useState("");
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: "contains" }, // Filtro global
  });

  const toast = useRef(null);

  const fetchSales = useCallback(async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "sales"));
      const salesData = querySnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
        saleDate: doc.data().saleDate.toDate(),
        remainingPayments: doc.data().remainingPayments || doc.data().purchaseTerms,
        paymentHistory: doc.data().paymentHistory || [],
        paymentDates: doc.data().paymentDates ? doc.data().paymentDates.map((date) => date.toDate()) : [],
      }));
      const sortedSales = salesData.sort((a, b) => b.saleDate - a.saleDate);
      setSales(sortedSales);
    } catch (error) {
      console.error("Error al obtener las ventas:", error);
    }
  }, [setSales]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const handlePayment = useCallback(
    async (sale, paymentAmount = 0) => {
      let updatedRemainingPayments;
      let newPaymentHistory;

      if (sale.purchaseTerms === -1) {
        const newTotalSalePrice = sale.totalSalePrice - paymentAmount;
        updatedRemainingPayments = newTotalSalePrice > 0 ? newTotalSalePrice : 0;
        newPaymentHistory = sale.paymentHistory ? [...sale.paymentHistory, paymentAmount] : [paymentAmount];
      } else {
        updatedRemainingPayments = sale.remainingPayments - 1;
        newPaymentHistory = sale.paymentHistory ? [...sale.paymentHistory, sale.termAmount] : [sale.termAmount];
      }

      const currentPaymentDate = new Date();

      try {
        const saleRef = doc(db, "sales", sale.id);
        await updateDoc(saleRef, {
          remainingPayments: updatedRemainingPayments,
          paymentDates: [...sale.paymentDates, currentPaymentDate],
          paymentHistory: newPaymentHistory,
        });

        setSales((prevSales) =>
          prevSales.map((s) =>
            s.id === sale.id
              ? {
                  ...s,
                  remainingPayments: updatedRemainingPayments,
                  paymentDates: [...s.paymentDates, currentPaymentDate],
                  paymentHistory: newPaymentHistory,
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
    },
    [setSales]
  );

  const deleteSale = useCallback(
    async (sale) => {
      try {
        await deleteDoc(doc(db, "sales", sale.id));
        setSales((prevSales) => prevSales.filter((s) => s.id !== sale.id));
        setDialogState((prevState) => ({ ...prevState, isDialogVisible: false }));

        toast.current.show({ severity: "success", summary: "Éxito", detail: "Venta eliminada correctamente", life: 3000 });
      } catch (error) {
        console.error("Error al eliminar la venta:", error);
      }
    },
    [setSales]
  );

  const toggleDialog = useCallback((dialogType, sale = null) => {
    setDialogState((prevState) => ({
      ...prevState,
      [dialogType]: !prevState[dialogType],
      selectedSale: sale || prevState.selectedSale,
    }));
  }, []);

  const updateSaleName = useCallback(async () => {
    try {
      const saleRef = doc(db, "sales", dialogState.selectedSale.id);
      await updateDoc(saleRef, { buyerName: newSaleName });

      setSales((prevSales) => prevSales.map((s) => (s.id === dialogState.selectedSale.id ? { ...s, buyerName: newSaleName } : s)));

      toast.current.show({
        severity: "success",
        summary: "Éxito",
        detail: "Nombre del comprador actualizado correctamente",
        life: 3000,
      });

      toggleDialog("isEditDialogVisible");
    } catch (error) {
      console.error("Error al actualizar el nombre del comprador:", error);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo actualizar el nombre del comprador",
        life: 3000,
      });
    }
  }, [dialogState.selectedSale, newSaleName, setSales, toggleDialog]);

  const paymentDatesTemplate = useCallback(
    (rowData) => (
      <>
        {rowData.paymentDates.map((date, index) => (
          <p key={index}>{new Date(date).toLocaleDateString()}</p>
        ))}
      </>
    ),
    []
  );

  const remainingPaymentsTemplate = useMemo(
    () => (rowData) => rowData.purchaseTerms === -1 ? "N/A" : `${rowData.remainingPayments}/${rowData.purchaseTerms}`,
    []
  );

  const paidAmountTemplate = useMemo(
    () => (rowData) => {
      if (rowData.purchaseTerms === -1) {
        const totalPaid = rowData.paymentHistory.reduce((acc, payment) => acc + parseFloat(payment), 0);
        return `$${totalPaid.toFixed(2)}`;
      }
      return "N/A";
    },
    []
  );

  const saleDateTemplate = useCallback((rowData) => new Date(rowData.saleDate).toLocaleDateString(), []);

  const salePriceTemplate = useCallback((rowData) => `$${parseFloat(rowData.totalSalePrice).toFixed(2)}`, []);

  const onGlobalFilterChange = useCallback(
    (e) => {
      const value = e.target.value;
      setFilters({
        ...filters,
        global: { value, matchMode: "contains" },
      });
      setGlobalFilterValue(value);
    },
    [filters]
  );

  const renderHeader = useMemo(
    () => (
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
    ),
    [globalFilterValue, onGlobalFilterChange]
  );

  const actionBodyTemplate = useCallback(
    (sale) => (
      <>
        <Button
          label="Pago"
          icon="pi pi-check"
          className="p-button-success mr-2"
          disabled={sale.remainingPayments <= 0 && sale.purchaseTerms !== -1}
          onClick={() => {
            toggleDialog("isPaymentDialogVisible", sale);
          }}
        />
        <Button
          label="Editar"
          icon="pi pi-pencil"
          className="p-button-warning mt-1"
          onClick={() => toggleDialog("isEditDialogVisible", sale)}
        />
        <Button
          label="Eliminar"
          icon="pi pi-trash"
          className="p-button-danger mt-1"
          onClick={() => toggleDialog("isDialogVisible", sale)}
        />
      </>
    ),
    [toggleDialog]
  );

  return (
    <div className="container mx-auto mt-6">
      <Toast ref={toast} />

      <EditSaleDialog
        visible={dialogState.isEditDialogVisible}
        onHide={() => toggleDialog("isEditDialogVisible")}
        selectedSale={dialogState.selectedSale}
        newSaleName={newSaleName}
        setNewSaleName={setNewSaleName}
        updateSaleName={updateSaleName}
      />

      <DeleteSaleDialog
        visible={dialogState.isDialogVisible}
        onHide={() => toggleDialog("isDialogVisible")}
        selectedSale={dialogState.selectedSale}
        deleteSale={deleteSale}
      />

      <PaymentDialog
        visible={dialogState.isPaymentDialogVisible}
        onHide={() => toggleDialog("isPaymentDialogVisible")}
        selectedSale={dialogState.selectedSale}
        paymentAmount={paymentAmount}
        setPaymentAmount={setPaymentAmount}
        handlePayment={handlePayment}
      />

      <div className="p-grid">
        <div className="p-col-12">
          <Card>
            <h2 className="text-center">Ventas</h2>
            <Divider />
            <TabView>
              <TabPanel header="Todas las ventas">
                <DataTable
                  value={sales}
                  paginator
                  rows={10}
                  responsiveLayout="scroll"
                  globalFilterFields={["buyerName", "items"]}
                  header={renderHeader}
                  filters={filters}
                >
                  <Column field="items" header="Artículos"></Column>
                  <Column field="buyerName" header="Cliente" sortable></Column>
                  <Column field="totalPurchasePrice" header="P.Compra" body={salePriceTemplate} />
                  <Column field="totalSalePrice" header="P.Venta" body={salePriceTemplate} />
                  <Column field="remainingPayments" header="Cuotas Restantes" body={remainingPaymentsTemplate} />
                  <Column field="paidAmount" header="Monto Pagado" body={paidAmountTemplate} />
                  <Column field="saleDate" header="Fecha de Ingreso" body={saleDateTemplate} />
                  <Column field="paymentDates" header="Fechas de Pago" body={paymentDatesTemplate} sortable />
                  <Column body={actionBodyTemplate} header="Acciones"></Column>
                </DataTable>
              </TabPanel>

              <TabPanel header="Ventas finalizadas">
                <DataTable
                  value={sales.filter((sale) => {
                    if (sale.purchaseTerms === -1) {
                      // Ventas flexibles
                      const totalPaid = sale.paymentHistory.reduce((acc, payment) => acc + parseFloat(payment), 0);
                      return totalPaid >= sale.totalSalePrice; // Si ya se ha pagado el total
                    }
                    // Ventas con cuotas regulares (consideramos finalizado si remainingPayments es 0)
                    return sale.remainingPayments === 0 || sale.remainingPayments === sale.purchaseTerms;
                  })}
                  paginator
                  rows={10}
                  responsiveLayout="scroll"
                  globalFilterFields={["buyerName", "items"]}
                  header={renderHeader}
                  filters={filters}
                >
                  <Column field="items" header="Artículos"></Column>
                  <Column field="buyerName" header="Cliente" sortable></Column>
                  <Column field="totalPurchasePrice" header="P.Compra" body={salePriceTemplate} />
                  <Column field="totalSalePrice" header="P.Venta" body={salePriceTemplate} />
                  <Column field="remainingPayments" header="Cuotas Restantes" body={remainingPaymentsTemplate} />
                  <Column field="paidAmount" header="Monto Pagado" body={paidAmountTemplate} />
                  <Column field="saleDate" header="Fecha de Ingreso" body={saleDateTemplate} />
                  <Column field="paymentDates" header="Fechas de Pago" body={paymentDatesTemplate} sortable />
                </DataTable>
              </TabPanel>

              <TabPanel header="Pendiente de pago">
                <DataTable
                  value={sales.filter((sale) => {
                    if (sale.purchaseTerms === -1) {
                      const totalPaid = sale.paymentHistory.reduce((acc, payment) => acc + parseFloat(payment), 0);
                      return totalPaid < sale.totalSalePrice;
                    }
                    return sale.remainingPayments > 0;
                  })}
                  paginator
                  rows={10}
                  responsiveLayout="scroll"
                  globalFilterFields={["buyerName", "items"]}
                  header={renderHeader}
                  filters={filters}
                >
                  <Column field="items" header="Artículos"></Column>
                  <Column field="buyerName" header="Cliente" sortable></Column>
                  <Column field="totalPurchasePrice" header="P.Compra" body={salePriceTemplate} />
                  <Column field="totalSalePrice" header="P.Venta" body={salePriceTemplate} />
                  <Column field="remainingPayments" header="Cuotas Restantes" body={remainingPaymentsTemplate} />
                  <Column field="paidAmount" header="Monto Pagado" body={paidAmountTemplate} />
                  <Column field="saleDate" header="Fecha de Ingreso" body={saleDateTemplate} />
                  <Column field="paymentDates" header="Fechas de Pago" body={paymentDatesTemplate} sortable />
                  <Column body={actionBodyTemplate} header="Acciones"></Column>
                </DataTable>
              </TabPanel>
            </TabView>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Sales;
