import React, { useState, useEffect, useRef } from "react";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
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
  const [monthlyProfits, setMonthlyProfits] = useState({}); // Nuevo estado para almacenar ganancias por mes
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedSale, setSelectedSale] = useState(null); // Para el Dialog
  const [isDialogVisible, setDialogVisible] = useState(false); // Controla la visibilidad del Dialog
  const toast = useRef(null); // Referencia para el Toast

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "sales"));
        const salesData = querySnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
          saleDate: doc.data().saleDate.toDate(),
        }));

        const sortedSales = salesData.sort((a, b) => b.saleDate - a.saleDate);
        setSales(sortedSales);

        // Calcular las ganancias mensuales
        const profitsByMonth = sortedSales.reduce((acc, sale) => {
          const saleMonth = sale.saleDate.getMonth(); // Obtener el mes
          const saleYear = sale.saleDate.getFullYear(); // Obtener el año
          const monthYearKey = `${saleYear}-${saleMonth + 1}`; // Llave en formato "YYYY-MM"

          const profit = sale.salePrice - sale.purchasePrice;

          // Sumar la ganancia al mes correspondiente
          if (!acc[monthYearKey]) {
            acc[monthYearKey] = { totalProfit: 0, sales: 0 };
          }

          acc[monthYearKey].totalProfit += profit;
          acc[monthYearKey].sales += 1;

          return acc;
        }, {});

        setMonthlyProfits(profitsByMonth); // Guardar las ganancias mensuales en el estado

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

  const confirmDeleteSale = (sale) => {
    setSelectedSale(sale); // Guardamos la venta seleccionada
    setDialogVisible(true); // Mostramos el Dialog
  };

  const deleteSale = async () => {
    try {
      await deleteDoc(doc(db, "sales", selectedSale.id));
      setSales(sales.filter((sale) => sale.id !== selectedSale.id));
      setFilteredSales(filteredSales.filter((sale) => sale.id !== selectedSale.id));
      setDialogVisible(false); // Ocultamos el Dialog

      // Mostramos el toast de éxito
      toast.current.show({ severity: "success", summary: "Éxito", detail: "Venta eliminada correctamente", life: 3000 });
    } catch (error) {
      console.error("Error al eliminar la venta:", error);
    }
  };

  const deleteButton = (data) => {
    return <Button label="Eliminar" icon="pi pi-trash" className="p-button-danger" onClick={() => confirmDeleteSale(data)} />;
  };

  return (
    <div className="container mx-auto mt-6">
      <Toast ref={toast} /> {/* Componente Toast */}
      <Dialog
        visible={isDialogVisible}
        style={{ width: "350px" }}
        header="Confirmar eliminación"
        modal
        footer={
          <div>
            <Button label="No" icon="pi pi-times" onClick={() => setDialogVisible(false)} className="p-button-text" />
            <Button label="Sí" icon="pi pi-check" onClick={deleteSale} autoFocus />
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
        {/* Columna izquierda: Tabla de ventas */}
        <div className="p-col-12 p-md-8">
          <Card>
            <h4 className="text-center">Ganancias por Joyas Vendidas</h4>
            <Divider />

            {/* DatePickers para seleccionar el rango de fechas */}
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
              <Column field="purchasePrice" header="Precio de Compra"></Column>
              <Column field="salePrice" header="Precio de Venta"></Column>
              <Column field="profit" header="Ganancia" body={(data) => data.salePrice - data.purchasePrice}></Column>
              <Column
                field="saleDate"
                header="Fecha de Venta"
                body={(data) => `${data.saleDate.toLocaleDateString()} ${data.saleDate.toLocaleTimeString()}`}
              ></Column>
              <Column body={deleteButton} header="Eliminar"></Column>
            </DataTable>
          </Card>
        </div>

        {/* Columna derecha: Ganancia mensual */}
        <div className="p-col-12 p-md-4">
          <Card>
            <h4 className="text-center">Ganancia del Mes</h4>
            <Divider />
            <div className="text-center text-xl">${monthlyProfit.toFixed(2)}</div>

            {/* Mostrar las ganancias por cada mes */}
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
