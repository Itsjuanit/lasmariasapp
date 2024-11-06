import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { Card } from "primereact/card";
import { Divider } from "primereact/divider";
import { Chart } from "primereact/chart";

const Profits = () => {
  const [monthlyProfit, setMonthlyProfit] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [monthlyProfits, setMonthlyProfits] = useState({});
  const months = ["Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "sales"));
        const salesData = querySnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
          paymentDates: doc.data().paymentDates || [],
          paymentHistory: doc.data().paymentHistory || [],
        }));

        console.log("Sales data fetched from Firestore:", salesData);

        const profitsByMonth = months.reduce((acc, month) => {
          acc[month] = { totalProfit: 0, sales: 0, items: 0 };
          return acc;
        }, {});

        salesData.forEach((sale) => {
          if (sale.paymentDates && sale.paymentDates.length > 0) {
            sale.paymentDates.forEach((timestamp, index) => {
              const paymentDate = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
              const paymentMonth = paymentDate.getMonth();
              const paymentYear = paymentDate.getFullYear();

              if (paymentYear === new Date().getFullYear() && paymentMonth >= 7 && paymentMonth <= 11) {
                const monthName = months[paymentMonth - 7];
                const saleProfit = sale.totalSalePrice - sale.totalPurchasePrice; // Ganancia real

                // Solo sumamos la ganancia total una vez por venta
                if (index === 0) {
                  profitsByMonth[monthName].totalProfit += saleProfit || 0;
                }

                profitsByMonth[monthName].sales += 1;
                profitsByMonth[monthName].items += sale.items?.split(",").length || 0;
              }
            });
          }
        });

        console.log("Profits by month after processing:", profitsByMonth);

        setMonthlyProfits(profitsByMonth);
        const totalProfit = Object.values(profitsByMonth).reduce((sum, val) => sum + val.totalProfit, 0);
        const totalSales = Object.values(profitsByMonth).reduce((sum, val) => sum + val.sales, 0);
        const totalItems = Object.values(profitsByMonth).reduce((sum, val) => sum + val.items, 0);

        console.log("Total Profit:", totalProfit);
        console.log("Total Sales:", totalSales);
        console.log("Total Items:", totalItems);

        setMonthlyProfit(totalProfit);
        setTotalSales(totalSales);
        setTotalItems(totalItems);
      } catch (error) {
        console.error("Error al obtener las ventas:", error);
      }
    };

    fetchSales();
  }, []);

  // Datos para el gráfico de líneas (solo de agosto a diciembre)
  const chartData = {
    labels: months,
    datasets: [
      {
        label: "Ganancia",
        data: months.map((month) => monthlyProfits[month]?.totalProfit || 0),
        fill: false,
        borderColor: "#42A5F5",
        backgroundColor: "#42A5F5",
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
    },
  };

  return (
    <div className="container mx-auto mt-6">
      <h1 className="text-center text-2xl font-bold mb-6" style={{ color: "#212121" }}>
        Panel de Ganancias
      </h1>
      <div className="flex flex-wrap justify-center gap-4 mb-6 align-center" style={{ justifyContent: "center" }}>
        <div className="gap-4 mb-6">
          <Card style={{ width: "250px" }}>
            <h4 className="text-center">Ventas Realizadas</h4>
            <Divider />
            <div className="text-center text-3xl font-bold">{totalSales}</div>
          </Card>
        </div>
        <div className="p-col-12 p-md-4">
          <Card style={{ width: "250px" }}>
            <h4 className="text-center">Cantidad de Artículos</h4>
            <Divider />
            <div className="text-center text-3xl font-bold">{totalItems}</div>
          </Card>
        </div>
        <div className="p-col-12 p-md-4">
          <Card style={{ width: "250px" }}>
            <h4 className="text-center">Ganancia Total</h4>
            <Divider />
            <div className="text-center text-3xl font-bold">${monthlyProfit.toFixed(2)}</div>
          </Card>
        </div>
      </div>

      <div className="p-grid mb-4">
        <div className="p-col-12">
          <Card>
            <h4 className="text-center">Gráfico de Ganancias</h4>
            <Divider />
            <Chart
              type="bar"
              data={chartData}
              options={chartOptions}
              style={{ justifyContent: "center", display: "flex", height: "300px" }}
            />
          </Card>
        </div>
      </div>

      <div className="p-grid">
        {Object.keys(monthlyProfits).map((monthYearKey, index) => (
          <div className="p-col-6 p-md-4 p-lg-2" key={index}>
            <Card>
              <h4 className="text-center">{monthYearKey}</h4>
              <Divider />
              <div className="text-center text-xl font-semibold">${monthlyProfits[monthYearKey].totalProfit.toFixed(2)}</div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Profits;
