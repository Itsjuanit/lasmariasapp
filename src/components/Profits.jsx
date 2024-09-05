import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { Card } from "primereact/card";
import { Divider } from "primereact/divider";

const Profits = () => {
  const [monthlyProfit, setMonthlyProfit] = useState(0);
  const [monthlyProfits, setMonthlyProfits] = useState({});

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "sales"));
        const salesData = querySnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
          saleDate: doc.data().saleDate.toDate(),
          paymentDates: doc.data().paymentDates || [],
          termAmount: doc.data().termAmount,
        }));

        const profitsByMonth = salesData.reduce((acc, sale) => {
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
        setMonthlyProfit(Object.values(profitsByMonth).reduce((sum, val) => sum + val.totalProfit, 0));
      } catch (error) {
        console.error("Error al obtener las ventas:", error);
      }
    };

    fetchSales();
  }, []);

  return (
    <div className="container mx-auto mt-6">
      <div className="p-grid">
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
