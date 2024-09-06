import React, { useState, useEffect, useRef } from "react";
import { collection, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Calendar } from "primereact/calendar";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Divider } from "primereact/divider";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedSale, setSelectedSale] = useState(null);
  const [isDialogVisible, setDialogVisible] = useState(false);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: "contains" },
  });
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
          paymentDates: doc.data().paymentDates ? doc.data().paymentDates.map((date) => date.toDate()) : [],
        }));

        // Ordenar por fecha de venta en orden descendente
        const sortedSales = salesData.sort((a, b) => b.saleDate - a.saleDate);

        setSales(sortedSales); // Guardar las ventas ordenadas
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

  const createWhatsAppLink = (sale, updatedRemainingPayments) => {
    const { buyerName, buyerPhone, termAmount, totalSalePrice, purchaseTerms, items } = sale;

    const parsedTermAmount = parseFloat(termAmount) || 0;
    const parsedTotalSalePrice = parseFloat(totalSalePrice) || 0;
    const paidInstallments = purchaseTerms - updatedRemainingPayments;
    const totalPaid = paidInstallments * parsedTermAmount;
    const remainingAmount = parsedTotalSalePrice - totalPaid;

    // Limpiar el número de teléfono, eliminando cualquier prefijo +54 o +549
    let cleanPhoneNumber = buyerPhone.replace(/\D/g, ""); // Eliminar caracteres no numéricos
    if (cleanPhoneNumber.startsWith("549")) {
      cleanPhoneNumber = cleanPhoneNumber.slice(3); // Eliminar prefijo +549 si está presente
    } else if (cleanPhoneNumber.startsWith("54")) {
      cleanPhoneNumber = cleanPhoneNumber.slice(2); // Eliminar prefijo +54 si está presente
    }

    const phoneNumber = `549${cleanPhoneNumber}`; // Asegurarse de agregar el prefijo +549 solo una vez

    let message;

    // Mensaje para pagos incompletos (con cuotas restantes)
    if (updatedRemainingPayments > 0) {
      const cuotaWord = updatedRemainingPayments === 1 ? "cuota" : "cuotas"; // Singular/plural
      const pagoWord = paidInstallments === 1 ? "una cuota" : `${paidInstallments} cuotas`; // Singular/plural

      message = `Hola ${buyerName}, somos Las Marias.
  
  Queremos agradecerte por tu compra de "${items}".
  
  Has pagado ${pagoWord} de $${parsedTermAmount.toFixed(2)} cada una. El valor total de tu compra es de $${parsedTotalSalePrice.toFixed(2)}.
  
  Hasta el momento, has abonado $${totalPaid.toFixed(2)}, y te faltan $${remainingAmount.toFixed(2)} para completar el pago.
  
  Te quedan ${updatedRemainingPayments} ${cuotaWord} por pagar. Si tienes alguna duda, no dudes en contactarnos. ¡Gracias por confiar en nosotros!`;
    } else {
      // Mensaje cuando se completan todos los pagos
      message = `Hola ${buyerName}, somos Las Marias.
  
  ¡Felicidades! Has completado el pago total de tu compra de "${items}". Valor total: $${parsedTotalSalePrice.toFixed(2)}.
  
  Gracias por confiar en nosotros. Si necesitas más información o asistencia, no dudes en contactarnos. ¡Esperamos verte pronto!`;
    }

    // Crear el enlace de WhatsApp con codificación de URL
    const whatsappLink = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    return whatsappLink;
  };

  const handlePayment = async (sale) => {
    const updatedRemainingPayments = sale.remainingPayments - 1; // Actualizar cuotas restantes
    const currentPaymentDate = new Date();

    try {
      const saleRef = doc(db, "sales", sale.id);
      await updateDoc(saleRef, {
        remainingPayments: updatedRemainingPayments > 0 ? updatedRemainingPayments : 0,
        paymentDates: [...sale.paymentDates, currentPaymentDate],
      });

      // Actualizar localmente la venta
      setSales(
        sales.map((s) =>
          s.id === sale.id
            ? {
                ...s,
                remainingPayments: updatedRemainingPayments > 0 ? updatedRemainingPayments : 0,
                paymentDates: [...s.paymentDates, currentPaymentDate],
              }
            : s
        )
      );

      toast.current.show({
        severity: "success",
        summary: "Éxito",
        detail: `Pago de cuota registrado. Quedan ${updatedRemainingPayments} cuotas`,
        life: 3000,
      });

      // Generar el enlace de WhatsApp con los valores actualizados
      const whatsappLink = createWhatsAppLink(sale, updatedRemainingPayments);
      window.open(whatsappLink, "_blank");
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

  const confirmDeleteSale = (sale) => {
    setSelectedSale(sale);
    setDialogVisible(true);
  };

  const paymentButton = (sale) => (
    <Button
      label="Pago"
      icon="pi pi-check"
      className="p-button-success mr-2"
      disabled={sale.remainingPayments <= 0}
      onClick={() => handlePayment(sale)}
    />
  );

  const deleteButton = (sale) => (
    <Button label="Eliminar" icon="pi pi-trash" className="p-button-danger" onClick={() => confirmDeleteSale(sale)} />
  );

  const actionBodyTemplate = (sale) => (
    <>
      {paymentButton(sale)}
      {deleteButton(sale)}
    </>
  );

  const paymentDatesTemplate = (rowData) => (
    <>
      {rowData.paymentDates.map((date, index) => (
        <p key={index}>{new Date(date).toLocaleDateString()}</p>
      ))}
    </>
  );

  const purchasePriceTemplate = (rowData) => {
    const itemsArray = typeof rowData.items === "string" ? rowData.items.split(",") : rowData.items;
    const itemCount = itemsArray.length;
    console.log("Artículos:", itemsArray, "Cantidad:", itemCount, "Precio de compra:", rowData.totalPurchasePrice);
    if (itemCount > 1) {
      return "N/A";
    } else if (itemCount === 1 && rowData.totalPurchasePrice) {
      return `$${rowData.totalPurchasePrice.toFixed(2)}`;
    } else {
      return "N/A";
    }
  };

  const saleDateTemplate = (rowData) => new Date(rowData.saleDate).toLocaleDateString();
  const salePriceTemplate = (rowData) => {
    return `$${parseFloat(rowData.totalSalePrice).toFixed(2)}`;
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
        <div className="p-col-12">
          <Card>
            <h4 className="text-center">Ventas</h4>
            <Divider />

            <div className="p-grid p-mb-4" style={{ display: "flex" }}>
              <div style={{ marginRight: "10px" }}>
                <Calendar value={startDate} onChange={(e) => setStartDate(e.value)} placeholder="Fecha Inicio" className="mb-2" showIcon />
              </div>
              <div style={{ marginRight: "10px" }}>
                <Calendar value={endDate} onChange={(e) => setEndDate(e.value)} placeholder="Fecha Fin" className="mb-2" showIcon />
              </div>
              <div style={{}}>
                <Button label="Buscar" onClick={filterSalesByDate} className="p-mb-4" />
              </div>
            </div>

            <DataTable
              value={filteredSales.length > 0 ? filteredSales : sales}
              responsiveLayout="scroll"
              style={{ marginTop: "20px" }}
              rowsPerPageOptions={[5, 10, 25, 50]}
              rows={10}
              paginator
              filters={filters}
              globalFilterFields={["buyerName", "items"]}
              header={renderHeader()}
            >
              <Column field="items" header="Artículos"></Column>
              <Column field="buyerName" header="Cliente" sortable></Column>
              <Column field="totalPurchasePrice" header="P.Compra" body={purchasePriceTemplate} />
              <Column field="totalSalePrice" header="P.Venta" body={salePriceTemplate} />
              <Column field="remainingPayments" header="Cuotas" body={(data) => `${data.remainingPayments}/${data.purchaseTerms}`} />
              <Column field="saleDate" header="Fecha de Ingreso" body={saleDateTemplate} />
              <Column field="paymentDates" header="Fechas de Pago" body={paymentDatesTemplate} />
              <Column body={actionBodyTemplate} header="Acciones"></Column>
            </DataTable>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Sales;
