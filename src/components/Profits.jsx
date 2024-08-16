import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { Divider } from "primereact/divider";

const Profits = () => {
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [monthlyProfit, setMonthlyProfit] = useState(0);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

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

  return (
    <div className="container mx-auto mt-6">
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

            <DataTable value={filteredSales.length > 0 ? filteredSales : sales} responsiveLayout="scroll">
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
            </DataTable>
          </Card>
        </div>

        {/* Columna derecha: Ganancia mensual */}
        <div className="p-col-12 p-md-4">
          <Card>
            <h4 className="text-center">Ganancia del Mes</h4>
            <Divider />
            <div className="text-center text-xl">${monthlyProfit.toFixed(2)}</div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profits;
