// utils.js

export const createWhatsAppLink = (sale, updatedRemainingPayments) => {
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
