import React, { useState, useEffect, useRef } from "react";
import { collection, getDocs, deleteDoc, doc, updateDoc, addDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Toolbar } from "primereact/toolbar";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { InputText } from "primereact/inputtext";
import ConfirmSaleDialog from "./ConfirmSaleDialog"; // Importar el nuevo componente

const Dashboard = () => {
  const [joyas, setJoyas] = useState([]);
  const [selectedJoyas, setSelectedJoyas] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [purchaseTerms, setPurchaseTerms] = useState(1);
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: "contains" },
  });
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const toast = useRef(null);
  const navigate = useNavigate();

  const termOptions = [
    { label: "Sin cuotas", value: 1 },
    { label: "2 cuotas", value: 2 },
    { label: "3 cuotas", value: 3 },
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

  const handleConfirmSale = async () => {
    if (selectedJoyas.length > 0) {
      try {
        const totalSalePrice = selectedJoyas.reduce((acc, joya) => acc + joya.salePrice, 0);
        const totalPurchasePrice = selectedJoyas.reduce((acc, joya) => acc + joya.purchasePrice, 0);
        const termAmount = totalSalePrice / purchaseTerms;
        const itemNames = selectedJoyas.map((joya) => joya.name).join(", ");

        await addDoc(collection(db, "sales"), {
          items: itemNames,
          buyerName: buyerName || "Desconocido",
          buyerPhone: buyerPhone,
          purchaseTerms: purchaseTerms,
          totalSalePrice: totalSalePrice,
          totalPurchasePrice: totalPurchasePrice,
          termAmount: termAmount.toFixed(2),
          remainingPayments: purchaseTerms,
          sold: selectedJoyas.length,
          saleDate: new Date(),
        });

        for (const joya of selectedJoyas) {
          const jewelryRef = doc(db, "jewelry", joya.id);
          const newQuantity = joya.quantity - 1;

          if (newQuantity >= 0) {
            await updateDoc(jewelryRef, { quantity: newQuantity });
            setJoyas((prevJoyas) => prevJoyas.map((j) => (j.id === joya.id ? { ...j, quantity: newQuantity } : j)));
          }
        }

        toast.current.show({ severity: "success", summary: "Éxito", detail: "Venta registrada correctamente", life: 3000 });

        setSelectedJoyas([]);
        setOpenModal(false);
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
      <div className="flex justify-content-between">
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
        <Button
          label="Confirmar Venta"
          icon="pi pi-check"
          className="p-button-success"
          onClick={() => setOpenModal(true)}
          disabled={selectedJoyas.length === 0}
        />
      </div>
    );
  };

  const actionBodyTemplate = (rowData) => {
    return (
      <>
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-warning mr-1"
          onClick={() => handleEdit(rowData.id)}
          tooltip="Editar"
        />
        <Button
          label=""
          icon="pi pi-shopping-cart"
          className="p-button-rounded p-button-success mr-1"
          onClick={() => {
            setSelectedJoyas([rowData]);
            setOpenModal(true);
          }}
          disabled={rowData.quantity <= 0}
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
        selectionMode="checkbox"
        selection={selectedJoyas}
        onSelectionChange={(e) => setSelectedJoyas(e.value)}
        paginator
        rows={10}
        responsiveLayout="scroll"
        emptyMessage="No se encontraron joyas."
        rowsPerPageOptions={[5, 10, 25, 50]}
        filters={filters}
        globalFilterFields={["name", "type"]}
        header={renderHeader()}
      >
        <Column selectionMode="multiple" headerStyle={{ width: "3rem" }}></Column>
        <Column field="name" header="Nombre" sortable></Column>
        <Column field="type" header="Tipo" sortable></Column>
        <Column field="purchasePrice" header="Precio de Compra"></Column>
        <Column field="salePrice" header="Precio de Venta"></Column>
        <Column field="quantity" header="Cantidad" sortable></Column>
        <Column
          field="image"
          header="Imagen"
          body={(data) =>
            data.image ? (
              <img
                src={data.image}
                alt={data.name}
                style={{
                  width: "100px",
                  height: "100px",
                  objectFit: "cover",
                  borderRadius: "8px",
                }}
              />
            ) : (
              "Sin imagen"
            )
          }
        />
        <Column body={actionBodyTemplate} header="Acciones"></Column>
      </DataTable>

      <ConfirmSaleDialog
        visible={openModal}
        onHide={() => setOpenModal(false)}
        buyerName={buyerName}
        setBuyerName={setBuyerName}
        buyerPhone={buyerPhone}
        setBuyerPhone={setBuyerPhone}
        purchaseTerms={purchaseTerms}
        setPurchaseTerms={setPurchaseTerms}
        termOptions={termOptions}
        handleConfirmSale={handleConfirmSale}
      />

      <ConfirmDialog />
    </div>
  );
};

export default Dashboard;
