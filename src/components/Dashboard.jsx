import React, { useState, useEffect, useRef } from "react";
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
import { FilterMatchMode } from "primereact/api";
import { Dropdown } from "primereact/dropdown";
import { Tooltip } from "primereact/tooltip";

const Dashboard = () => {
  const [joyas, setJoyas] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [selectedJoya, setSelectedJoya] = useState(null);
  const [buyerName, setBuyerName] = useState("");
  const [newSalePrice, setNewSalePrice] = useState("");
  const [purchaseTerms, setPurchaseTerms] = useState(1); // Valor por defecto como número
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const navigate = useNavigate();
  const toast = useRef(null);

  const termOptions = [
    { label: "Sin plazos", value: 1 },
    { label: "2 plazos", value: 2 },
    { label: "3 plazos", value: 3 },
  ];

  // Obtener las joyas desde Firestore
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

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "jewelry", id));
      setJoyas(joyas.filter((item) => item.id !== id));
      toast.current.show({ severity: "success", summary: "Éxito", detail: "Joya eliminada correctamente", life: 3000 });
    } catch (error) {
      console.error("Error al eliminar el artículo:", error);
    }
  };

  const handleOpenModal = (joya) => {
    setSelectedJoya(joya);
    setBuyerName("");
    setNewSalePrice("");
    setPurchaseTerms(1); // Por defecto, seleccionar "Sin plazos"
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedJoya(null);
  };

  const handleConfirmSale = async () => {
    if (selectedJoya) {
      try {
        const jewelryRef = doc(db, "jewelry", selectedJoya.id);
        const newQuantity = selectedJoya.quantity - 1;
        const finalSalePrice = newSalePrice ? parseFloat(newSalePrice) : selectedJoya.salePrice;
        const termAmount = finalSalePrice / purchaseTerms; // Cálculo de cada cuota

        if (newQuantity >= 0) {
          await updateDoc(jewelryRef, { quantity: newQuantity });

          await addDoc(collection(db, "sales"), {
            name: selectedJoya.name,
            type: selectedJoya.type,
            purchasePrice: selectedJoya.purchasePrice,
            salePrice: finalSalePrice,
            buyerName: buyerName || "Desconocido",
            purchaseTerms: purchaseTerms, // Guardamos solo la cantidad de plazos
            termAmount: termAmount.toFixed(2), // Guardamos el monto por cada plazo
            remainingPayments: purchaseTerms, // Cantidad de pagos restantes
            sold: 1,
            saleDate: new Date(),
            idJoya: selectedJoya.id,
          });

          setJoyas(joyas.map((item) => (item.id === selectedJoya.id ? { ...item, quantity: newQuantity } : item)));

          toast.current.show({ severity: "success", summary: "Éxito", detail: "Venta registrada correctamente", life: 3000 });
        } else {
          console.error("Stock insuficiente");
        }

        handleCloseModal();
      } catch (error) {
        console.error("Error al registrar la venta:", error.message);
      }
    }
  };

  const handleEdit = (id) => {
    navigate(`/edit/${id}`);
  };

  const handleAddJoya = () => {
    navigate("/upload");
  };

  const onGlobalFilterChange = (e) => {
    const value = e.target.value;
    let _filters = { ...filters };
    _filters["global"].value = value;
    setFilters(_filters);
    setGlobalFilterValue(value);
  };

  const renderHeader = () => {
    return (
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
    );
  };

  const header = renderHeader();

  const actionBodyTemplate = (rowData) => {
    return (
      <>
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-warning mr-1"
          onClick={() => handleEdit(rowData.id)}
          tooltipOptions={{ position: "top" }}
          tooltip="Editar"
        />
        <Button
          label=""
          icon="pi pi-shopping-cart"
          className="p-button-rounded p-button-success mr-1"
          onClick={() => handleOpenModal(rowData)}
          disabled={rowData.quantity <= 0}
          tooltipOptions={{ position: "top" }}
          tooltip="Vender"
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-danger mr-1"
          onClick={() =>
            confirmDialog({
              message: `¿Estás seguro de que quieres eliminar "${rowData.name}"?`,
              header: "Confirmar",
              icon: "pi pi-exclamation-triangle",
              accept: () => handleDelete(rowData.id),
            })
          }
          tooltipOptions={{ position: "top" }}
          tooltip="Eliminar"
        />
      </>
    );
  };

  return (
    <div className="container mx-auto mt-6">
      <Toast ref={toast} />
      <Toolbar className="mb-4" left={<Button label="Agregar Joya" icon="pi pi-plus" onClick={handleAddJoya} />} />

      <DataTable
        value={joyas}
        paginator
        rows={5}
        responsiveLayout="scroll"
        emptyMessage="No se encontraron joyas."
        rowsPerPageOptions={[5, 10, 25, 50]}
        filters={filters}
        globalFilterFields={["name", "type"]}
        header={header}
      >
        <Column field="name" header="Nombre" sortable></Column>
        <Column field="type" header="Tipo" sortable></Column>
        <Column field="purchasePrice" header="Precio de Compra"></Column>
        <Column field="salePrice" header="Precio de Venta"></Column>
        <Column field="quantity" header="Cantidad" sortable></Column>
        <Column
          field="image"
          header="Imagen"
          body={(data) =>
            data.image ? <img src={data.image} alt={data.name} style={{ width: "50px", borderRadius: "8px" }} /> : "Sin imagen"
          }
        ></Column>
        <Column body={actionBodyTemplate} header="Acciones"></Column>
      </DataTable>

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
          <label htmlFor="purchaseTerms">Plazos</label>
          <Dropdown
            value={purchaseTerms}
            options={termOptions}
            onChange={(e) => setPurchaseTerms(e.value)}
            placeholder="Selecciona el número de plazos"
          />
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
