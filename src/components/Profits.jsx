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
          paymentDates: doc.data().paymentDates || [],
        }));

        const sortedSales = salesData.sort((a, b) => b.saleDate - a.saleDate);
        setSales(sortedSales);

        const profitsByMonth = sortedSales.reduce((acc, sale) => {
          sale.paymentDates.forEach((date) => {
            const paymentMonth = new Date(date).getMonth();
            const paymentYear = new Date(date).getFullYear();
            const monthYearKey = `${paymentYear}-${paymentMonth + 1}`;
            const paymentAmount = parseFloat(sale.termAmount);

            if (!acc[monthYearKey]) {
              acc[monthYearKey] = { totalProfit: 0, sales: 0 };
            }

            acc[monthYearKey].totalProfit += paymentAmount;
            acc[monthYearKey].sales += 1;
          });

          return acc;
        }, {});

        setMonthlyProfits(profitsByMonth);
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

  const sendWhatsAppMessage = (buyerName, buyerPhone, remainingPayments, totalPayments) => {
    const message =
      remainingPayments > 0
        ? `Hola ${buyerName}, te habla Las Marias. Pagaste tu cuota. Te quedan ${remainingPayments} plazos restantes.`
        : `Hola ${buyerName}, te habla Las Marias. Pagaste todas tus cuotas. ¡Gracias por tu compra!`;

    console.log(`Enviar mensaje de WhatsApp a ${buyerPhone}: ${message}`);
  };

  const updateMonthlyProfits = (paymentAmount, paymentDate) => {
    const paymentMonth = paymentDate.getMonth();
    const paymentYear = paymentDate.getFullYear();
    const monthYearKey = `${paymentYear}-${paymentMonth + 1}`;

    const updatedMonthlyProfits = { ...monthlyProfits };

    if (!updatedMonthlyProfits[monthYearKey]) {
      updatedMonthlyProfits[monthYearKey] = { totalProfit: 0, sales: 0 };
    }

    updatedMonthlyProfits[monthYearKey].totalProfit += paymentAmount;
    updatedMonthlyProfits[monthYearKey].sales += 1;

    setMonthlyProfits(updatedMonthlyProfits);
  };

  const handlePayment = async (sale) => {
    const remainingPayments = sale.remainingPayments - 1;
    const currentPaymentDate = new Date();
    const paymentAmount = sale.termAmount;

    try {
      const saleRef = doc(db, "sales", sale.id);
      await updateDoc(saleRef, {
        remainingPayments: remainingPayments > 0 ? remainingPayments : 0,
        paymentDates: [...sale.paymentDates, currentPaymentDate],
      });

      setSales(
        sales.map((s) => (s.id === sale.id ? { ...s, remainingPayments, paymentDates: [...s.paymentDates, currentPaymentDate] } : s))
      );

      updateMonthlyProfits(parseFloat(paymentAmount), currentPaymentDate);

      sendWhatsAppMessage(sale.buyerName, sale.buyerPhone, remainingPayments, sale.purchaseTerms);

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

  const paymentDatesTemplate = (rowData) => {
    return (
      <>
        {rowData.paymentDates.map((date, index) => (
          <p key={index}>{new Date(date).toLocaleDateString()}</p>
        ))}
      </>
    );
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
        <div className="p-col-12 p-md-8">
          <Card>
            <h4 className="text-center">Ganancias por Joyas Vendidas</h4>
            <Divider />

            <div className="p-grid p-align-center p-justify-between p-mb-4">
              <div className="p-col-12 p-md-6">
                <Calendar
                  value={startDate}
                  onChange={(e) => setStartDate(e.value)}
                  placeholder="Fecha Inicio"
                  className="mb-2"
                  showIcon
                  style={{ width: "200px" }}
                />
              </div>
              <div className="p-col-12 p-md-6">
                <Calendar
                  value={endDate}
                  onChange={(e) => setEndDate(e.value)}
                  placeholder="Fecha Fin"
                  className="mb-2"
                  showIcon
                  style={{ width: "200px" }}
                />
              </div>
            </div>

            <Button label="Buscar" onClick={filterSalesByDate} className="p-mb-4" style={{ width: "200px" }} />

            <DataTable value={filteredSales.length > 0 ? filteredSales : sales} responsiveLayout="scroll" style={{ marginTop: "20px" }}>
              <Column field="items" header="Artículos"></Column>
              <Column field="buyerName" header="Comprador"></Column>
              <Column
                field="totalPurchasePrice"
                header="Precio de Compra"
                body={(data) => (data.sold > 1 ? "N/A" : data.totalPurchasePrice)}
              />
              <Column field="totalSalePrice" header="Precio de Venta"></Column>
              <Column
                field="remainingPayments"
                header="Plazos Restantes"
                body={(data) => `${data.remainingPayments}/${data.purchaseTerms}`}
              />
              <Column
                field="termAmount"
                header="Faltante por Pagar"
                body={(data) => ((data.totalSalePrice * data.remainingPayments) / data.purchaseTerms).toFixed(2)}
              />
              <Column field="paymentDates" header="Fechas de Pago" body={paymentDatesTemplate} />
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
