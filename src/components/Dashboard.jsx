import React, { useState, useEffect } from "react";
import { collection, getDocs, deleteDoc, doc, updateDoc, addDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Toast } from "primereact/toast";
import { Toolbar } from "primereact/toolbar";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";

const Dashboard = () => {
  const [joyas, setJoyas] = useState([]);
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

        const finalSalePrice = newSalePrice ? parseFloat(newSalePrice) : selectedJoya.salePrice;

        if (newQuantity >= 0) {
          await updateDoc(jewelryRef, { quantity: newQuantity });

          await addDoc(collection(db, "sales"), {
            name: selectedJoya.name,
            type: selectedJoya.type,
            purchasePrice: selectedJoya.purchasePrice,
            salePrice: finalSalePrice,
            buyerName: buyerName || "Desconocido",
            purchaseTerms: purchaseTerms || "Sin plazos",
            sold: 1,
            saleDate: new Date(),
            idJoya: selectedJoya.id,
          });

          setJoyas(joyas.map((item) => (item.id === selectedJoya.id ? { ...item, quantity: newQuantity } : item)));
        } else {
          console.error("Stock insuficiente");
        }

        handleCloseModal();
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

  // Columnas de la tabla
  const actionBodyTemplate = (rowData) => {
    return (
      <>
        <Button icon="pi pi-pencil" className="p-button-rounded p-button-warning mr-2" onClick={() => handleEdit(rowData.id)} />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-danger mr-2"
          onClick={() =>
            confirmDialog({
              message: `¿Estás seguro de que quieres eliminar "${rowData.name}"?`,
              header: "Confirmar",
              icon: "pi pi-exclamation-triangle",
              accept: () => handleDelete(rowData.id),
            })
          }
        />
        <Button
          label="Vender"
          icon="pi pi-shopping-cart"
          className="p-button-rounded p-button-success"
          onClick={() => handleOpenModal(rowData)}
          disabled={rowData.quantity <= 0}
        />
      </>
    );
  };

  return (
    <div className="container mx-auto mt-6">
      <Toolbar className="mb-4" left={<Button label="Agregar Joya" icon="pi pi-plus" onClick={handleAddJoya} />} />

      <DataTable value={joyas} paginator rows={5} responsiveLayout="scroll" emptyMessage="No se encontraron joyas.">
        <Column field="name" header="Nombre"></Column>
        <Column field="type" header="Tipo"></Column>
        <Column field="purchasePrice" header="Precio de Compra"></Column>
        <Column field="salePrice" header="Precio de Venta"></Column>
        <Column field="quantity" header="Cantidad"></Column>
        <Column
          field="image"
          header="Imagen"
          body={(data) =>
            data.image ? <img src={data.image} alt={data.name} style={{ width: "50px", borderRadius: "8px" }} /> : "Sin imagen"
          }
        ></Column>
        <Column body={actionBodyTemplate} header="Acciones"></Column>
      </DataTable>

      {/* Modal de confirmación de venta */}
      <Dialog visible={openModal} style={{ width: "450px" }} header="Confirmar Venta" modal className="p-fluid" onHide={handleCloseModal}>
        <div className="p-field">
          <label htmlFor="buyerName">Nombre del Comprador</label>
          <InputText id="buyerName" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} />
        </div>
        <div className="p-field">
          <label htmlFor="salePrice">Nuevo Precio de Venta</label>
          <InputNumber id="salePrice" value={newSalePrice} onChange={(e) => setNewSalePrice(e.value)} />
        </div>
        <div className="p-field">
          <label htmlFor="purchaseTerms">Plazos (opcional)</label>
          <InputText id="purchaseTerms" value={purchaseTerms} onChange={(e) => setPurchaseTerms(e.target.value)} />
        </div>
        <div className="p-field">
          <Button label="Cancelar" icon="pi pi-times" className="p-button-text" onClick={handleCloseModal} />
          <Button label="Confirmar" icon="pi pi-check" className="p-button-text" onClick={handleConfirmSale} />
        </div>
      </Dialog>

      <ConfirmDialog />
    </div>
  );
};

export default Dashboard;
