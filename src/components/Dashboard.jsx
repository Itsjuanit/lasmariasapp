import React, { useState, useEffect } from "react";
import { collection, getDocs, deleteDoc, doc, updateDoc, addDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
  IconButton,
  TableFooter,
  TablePagination,
  Card,
  CardContent,
  Modal,
  Box,
  TextField,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

const Dashboard = () => {
  const [joyas, setJoyas] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [openModal, setOpenModal] = useState(false);
  const [selectedJoya, setSelectedJoya] = useState(null);
  const [buyerName, setBuyerName] = useState(""); // Nombre del comprador
  const [newSalePrice, setNewSalePrice] = useState(""); // Precio de venta actualizado
  const [purchaseTerms, setPurchaseTerms] = useState(""); // Plazos de pago
  const navigate = useNavigate();

  // Función para obtener las joyas de la base de datos
  useEffect(() => {
    const fetchJoyas = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "jewelry"));
        const joyasData = querySnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));
        setJoyas(joyasData);
      } catch (error) {
        console.error("Error al obtener las joyas:", error);
      }
    };

    fetchJoyas();
  }, []);

  // Función para eliminar una joya
  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "jewelry", id));
      setJoyas(joyas.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Error al eliminar el artículo:", error);
    }
  };

  // Abrir el modal de confirmación de venta
  const handleOpenModal = (joya) => {
    setSelectedJoya(joya);
    setBuyerName(""); // Limpiar el nombre del comprador
    setNewSalePrice(""); // Limpiar el campo de precio de venta
    setPurchaseTerms(""); // Limpiar el campo de plazos
    setOpenModal(true);
  };

  // Cerrar el modal
  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedJoya(null);
  };

  // Confirmar la venta y reducir el stock, además de registrar la venta individual
  const handleConfirmSale = async () => {
    if (selectedJoya) {
      try {
        const jewelryRef = doc(db, "jewelry", selectedJoya.id);
        const newQuantity = selectedJoya.quantity - 1;

        // Mantener el precio de venta si el campo está vacío
        const finalSalePrice = newSalePrice ? parseFloat(newSalePrice) : selectedJoya.salePrice;

        if (newQuantity >= 0) {
          // Actualiza la cantidad en stock
          await updateDoc(jewelryRef, { quantity: newQuantity });

          // Registrar la venta en una colección separada llamada "sales"
          await addDoc(collection(db, "sales"), {
            name: selectedJoya.name,
            type: selectedJoya.type,
            purchasePrice: selectedJoya.purchasePrice,
            salePrice: finalSalePrice,
            buyerName: buyerName || "Desconocido", // Si el nombre del comprador está vacío, asignar "Desconocido"
            purchaseTerms: purchaseTerms || "Sin plazos", // Si el campo de plazos está vacío, asignar "Sin plazos"
            sold: 1, // Siempre será 1 por cada venta individual
            saleDate: new Date(), // Fecha y hora de la venta
            idJoya: selectedJoya.id, // ID de la joya original
          });

          // Actualiza el estado local de las joyas
          setJoyas(joyas.map((item) => (item.id === selectedJoya.id ? { ...item, quantity: newQuantity } : item)));
        } else {
          console.error("Stock insuficiente");
        }

        handleCloseModal(); // Cierra el modal después de confirmar
      } catch (error) {
        console.error("Error al registrar la venta:", error.message);
      }
    }
  };

  // Navegar a la página de edición
  const handleEdit = (id) => {
    navigate(`/edit/${id}`);
  };

  // Navegar a la página de agregar joya
  const handleAddJoya = () => {
    navigate("/upload");
  };

  // Función para manejar cambio de página
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Función para manejar cambio en el número de filas por página
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Estilos del modal
  const style = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 400,
    bgcolor: "background.paper",
    border: "2px solid #000",
    boxShadow: 24,
    p: 4,
  };

  return (
    <Grid
      container
      direction="column"
      alignItems="center"
      justifyContent="center"
      style={{ minHeight: "80vh", width: "90vw", marginTop: "100px" }}
    >
      <Card>
        <CardContent>
          <Grid container spacing={2} className="mt-4 mb-4">
            <Grid item>
              <Typography variant="h4">Inventario de Joyas</Typography>
            </Grid>
            <Grid item>
              <Button variant="contained" color="primary" onClick={handleAddJoya}>
                Agregar Joya
              </Button>
            </Grid>
          </Grid>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Precio de Compra</TableCell>
                  <TableCell>Precio de Venta</TableCell>
                  <TableCell>Ganancia</TableCell>
                  <TableCell>Cantidad</TableCell>
                  <TableCell>Imagen</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(rowsPerPage > 0 ? joyas.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage) : joyas).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.name || "Sin nombre"}</TableCell>
                    <TableCell>{item.type || "Sin tipo"}</TableCell>
                    <TableCell>{item.purchasePrice || 0}</TableCell>
                    <TableCell>{item.salePrice || 0}</TableCell>
                    <TableCell>{isNaN(item.salePrice - item.purchasePrice) ? 0 : item.salePrice - item.purchasePrice}</TableCell>
                    <TableCell>{item.quantity || 0}</TableCell>
                    <TableCell>
                      {item.image ? (
                        <img src={item.image} alt={item.name || "Imagen"} width="50" style={{ borderRadius: "8px" }} />
                      ) : (
                        "Sin imagen"
                      )}
                    </TableCell>
                    <TableCell>
                      <IconButton color="warning" onClick={() => handleEdit(item.id)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton color="error" onClick={() => handleDelete(item.id)}>
                        <DeleteIcon />
                      </IconButton>
                      <Button variant="contained" color="secondary" onClick={() => handleOpenModal(item)} disabled={item.quantity <= 0}>
                        Vender
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {rowsPerPage > 0 && joyas.length > 0 && (page + 1) * rowsPerPage > joyas.length && (
                  <TableRow style={{ height: 53 * ((page + 1) * rowsPerPage - joyas.length) }}>
                    <TableCell colSpan={10} />
                  </TableRow>
                )}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    count={joyas.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                  />
                </TableRow>
              </TableFooter>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Modal de confirmación */}
      <Modal open={openModal} onClose={handleCloseModal} aria-labelledby="modal-title" aria-describedby="modal-description">
        <Box sx={style}>
          <Typography id="modal-title" variant="h6" component="h2">
            Confirmar Venta
          </Typography>
          <TextField
            label="Nombre del Comprador"
            fullWidth
            value={buyerName}
            onChange={(e) => setBuyerName(e.target.value)}
            sx={{ mt: 2 }}
          />
          <TextField
            label="Nuevo Precio de Venta"
            fullWidth
            value={newSalePrice}
            onChange={(e) => setNewSalePrice(e.target.value)}
            sx={{ mt: 2 }}
            type="number"
          />
          <TextField
            label="Plazos (opcional)"
            fullWidth
            value={purchaseTerms}
            onChange={(e) => setPurchaseTerms(e.target.value)}
            sx={{ mt: 2 }}
          />
          <Grid container justifyContent="flex-end" spacing={2} sx={{ mt: 4 }}>
            <Grid item>
              <Button onClick={handleCloseModal} variant="contained" color="primary">
                Cancelar
              </Button>
            </Grid>
            <Grid item>
              <Button onClick={handleConfirmSale} variant="contained" color="secondary">
                Confirmar
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Modal>
    </Grid>
  );
};

export default Dashboard;
