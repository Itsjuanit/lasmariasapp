import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

const Profits = () => {
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [monthlyProfit, setMonthlyProfit] = useState(0);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // Función para obtener las ventas de la base de datos
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

  // Función para filtrar ventas por fecha
  const filterSalesByDate = () => {
    if (startDate && endDate) {
      const filtered = sales.filter((sale) => sale.saleDate >= startDate && sale.saleDate <= endDate);
      setFilteredSales(filtered);
    } else {
      setFilteredSales(sales);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container style={{ minHeight: "80vh", width: "90vw", marginTop: "100px" }}>
        <Grid container spacing={2}>
          {/* Columna izquierda: Tabla de ventas */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h4" gutterBottom>
                  Ganancias por Joyas Vendidas
                </Typography>
                {/* DatePickers para seleccionar el rango de fechas */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6}>
                    <DatePicker
                      label="Fecha Inicio"
                      value={startDate}
                      onChange={(newValue) => setStartDate(newValue)}
                      slots={{ textField: (props) => <TextField {...props} fullWidth /> }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <DatePicker
                      label="Fecha Fin"
                      value={endDate}
                      onChange={(newValue) => setEndDate(newValue)}
                      slots={{ textField: (props) => <TextField {...props} fullWidth /> }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button variant="contained" onClick={filterSalesByDate} fullWidth>
                      Buscar
                    </Button>
                  </Grid>
                </Grid>

                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Nombre</TableCell>
                        <TableCell>Comprador</TableCell>
                        <TableCell>Precio de Compra</TableCell>
                        <TableCell>Precio de Venta</TableCell>
                        <TableCell>Ganancia</TableCell>
                        <TableCell>Fecha de Venta</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(filteredSales.length > 0 ? filteredSales : sales).length > 0 ? (
                        (filteredSales.length > 0 ? filteredSales : sales).map((sale) => (
                          <TableRow key={sale.id}>
                            <TableCell>{sale.name || "Sin nombre"}</TableCell>
                            <TableCell>{sale.buyerName || "Desconocido"}</TableCell>
                            <TableCell>{sale.purchasePrice || 0}</TableCell>
                            <TableCell>{sale.salePrice || 0}</TableCell>
                            <TableCell>{isNaN(sale.salePrice - sale.purchasePrice) ? 0 : sale.salePrice - sale.purchasePrice}</TableCell>
                            <TableCell>
                              {sale.saleDate.toLocaleDateString()} {sale.saleDate.toLocaleTimeString()}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} align="center">
                            No hay ventas en el rango seleccionado.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Columna derecha: Tabla de ganancias mensuales */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h4" gutterBottom>
                  Ganancia del Mes
                </Typography>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Total Ganado en el Mes</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>${monthlyProfit.toFixed(2)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </LocalizationProvider>
  );
};

export default Profits;
