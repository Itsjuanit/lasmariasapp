export const createWhatsAppLink = (sale, updatedRemainingPayments) => {
  const { buyerName, buyerPhone, totalSalePrice, purchaseTerms, items } = sale;

  const parsedTotalSalePrice = parseFloat(totalSalePrice) || 0;

  let cleanPhoneNumber = buyerPhone.replace(/\D/g, "");
  if (cleanPhoneNumber.startsWith("549")) {
    cleanPhoneNumber = cleanPhoneNumber.slice(3);
  } else if (cleanPhoneNumber.startsWith("54")) {
    cleanPhoneNumber = cleanPhoneNumber.slice(2);
  }

  const phoneNumber = `549${cleanPhoneNumber}`;

  let message;

  if (purchaseTerms !== -1) {
    const cuotaWord = updatedRemainingPayments === 1 ? "cuota" : "cuotas";
    const paidInstallments = sale.paymentHistory.length;
    const parsedTermAmount = parsedTotalSalePrice / purchaseTerms;
    const pagoWord = paidInstallments === 1 ? "una cuota" : `${paidInstallments} cuotas`;
    const remainingAmount = parsedTotalSalePrice - sale.paymentHistory.reduce((acc, payment) => acc + parseFloat(payment), 0);

    if (updatedRemainingPayments > 0) {
      message = `Hola ${buyerName}, somos Las Marias.
      
      Queremos agradecerte por tu compra de "${items}".
      
      Has pagado ${pagoWord} de $${parsedTermAmount.toFixed(2)} cada una. El valor total de tu compra es de $${parsedTotalSalePrice.toFixed(
        2
      )}.
      
      Te quedan ${updatedRemainingPayments} ${cuotaWord} por pagar. Si tienes alguna duda, no dudes en contactarnos. ¡Gracias por confiar en nosotros!`;
    } else {
      message = `Hola ${buyerName}, somos Las Marias.
      
      ¡Felicidades! Has completado el pago total de tu compra de "${items}". Valor total: $${parsedTotalSalePrice.toFixed(2)}.
      
      Gracias por confiar en nosotros. ¡Esperamos verte pronto!`;
    }
  } else {
    message = `Hola ${buyerName}, somos Las Marias.
    
    Queremos agradecerte por tu compra de "${items}".
    
    Tu pago ha sido registrado. El valor total de tu compra es de $${parsedTotalSalePrice.toFixed(2)}.
    
    Si tienes alguna duda, no dudes en contactarnos. ¡Gracias por confiar en nosotros!`;
  }
  const whatsappLink = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
  return whatsappLink;
};
