import React, { useState, useEffect, useRef } from "react";
import { collection, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { Divider } from "primereact/divider";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";

const Profits = () => {
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [monthlyProfit, setMonthlyProfit] = useState(0);
  const [monthlyProfits, setMonthlyProfits] = useState({});
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
          saleDate: doc.data().saleDate.toDate(),
          remainingPayments: doc.data().remainingPayments || doc.data().purchaseTerms,
        }));

        const sortedSales = salesData.sort((a, b) => b.saleDate - a.saleDate);
        setSales(sortedSales);

        const profitsByMonth = sortedSales.reduce((acc, sale) => {
          const saleMonth = sale.saleDate.getMonth();
          const saleYear = sale.saleDate.getFullYear();
          const monthYearKey = `${saleYear}-${saleMonth + 1}`;
          const profit = sale.salePrice - sale.purchasePrice;

          if (!acc[monthYearKey]) {
            acc[monthYearKey] = { totalProfit: 0, sales: 0 };
          }

          acc[monthYearKey].totalProfit += profit;
          acc[monthYearKey].sales += 1;

          return acc;
        }, {});

        setMonthlyProfits(profitsByMonth);

        const currentMonth = new Date().getMonth();
        const totalProfit = sortedSales
          .filter((sale) => sale.saleDate.getMonth() === currentMonth)
          .reduce((acc, sale) => acc + (sale.salePrice - sale.purchasePrice), 0);

        setMonthlyProfit(totalProfit);
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
    const remainingAmount = (sale.salePrice * remainingPayments) / sale.purchaseTerms;

    try {
      const saleRef = doc(db, "sales", sale.id);
      await updateDoc(saleRef, {
        remainingPayments: remainingPayments > 0 ? remainingPayments : 0,
      });

      setSales(sales.map((s) => (s.id === sale.id ? { ...s, remainingPayments } : s)));
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

  const confirmDeleteSale = (sale) => {
    setSelectedSale(sale);
    setDialogVisible(true);
  };

  const actionBodyTemplate = (sale) => (
    <>
      {paymentButton(sale)}
      {deleteButton(sale)}
    </>
  );

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
              ¿Estás seguro de que deseas eliminar la venta de <b>{selectedSale.name}</b>?
            </span>
          )}
        </div>
      </Dialog>

      <div className="p-grid">
        <div className="p-col-12 p-md-8">
          <Card>
            <h4 className="text-center">Ganancias por Joyas Vendidas</h4>
            <Divider />

            <div className="p-grid p-align-center p-justify-between p-mb-4">
              <div className="p-col-12 p-md-6">
                <Calendar value={startDate} onChange={(e) => setStartDate(e.value)} placeholder="Fecha Inicio" className="w-full" />
              </div>
              <div className="p-col-12 p-md-6">
                <Calendar value={endDate} onChange={(e) => setEndDate(e.value)} placeholder="Fecha Fin" className="w-full" />
              </div>
            </div>

            <Button label="Buscar" onClick={filterSalesByDate} className="p-mb-4 w-full" />

            <DataTable value={filteredSales.length > 0 ? filteredSales : sales} responsiveLayout="scroll" style={{ marginTop: "20px" }}>
              <Column field="name" header="Nombre"></Column>
              <Column field="buyerName" header="Comprador"></Column>
              <Column field="purchasePrice" header="Precio de Compra"></Column> {/* Columna de Precio de Compra */}
              <Column field="salePrice" header="Precio de Venta"></Column>
              <Column
                field="remainingPayments"
                header="Plazos Restantes"
                body={(data) => `${data.remainingPayments}/${data.purchaseTerms}`}
              />
              <Column
                field="salePrice"
                header="Faltante por Pagar"
                body={(data) => ((data.salePrice * data.remainingPayments) / data.purchaseTerms).toFixed(2)}
              />
              <Column body={actionBodyTemplate} header="Acciones"></Column>
            </DataTable>
          </Card>
        </div>

        <div className="p-col-12 p-md-4">
          <Card>
            <h4 className="text-center">Ganancia del Mes</h4>
            <Divider />
            <div className="text-center text-xl">${monthlyProfit.toFixed(2)}</div>

            <h4 className="text-center mt-4">Ganancias por Mes</h4>
            <ul>
              {Object.keys(monthlyProfits).map((monthYearKey) => (
                <li key={monthYearKey}>
                  <strong>{monthYearKey}:</strong> ${monthlyProfits[monthYearKey].totalProfit.toFixed(2)} - Ventas:{" "}
                  {monthlyProfits[monthYearKey].sales}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profits;
