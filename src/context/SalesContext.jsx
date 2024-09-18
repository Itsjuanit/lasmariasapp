import React, { createContext, useContext, useState } from "react";

const SalesContext = createContext();

export const useSales = () => useContext(SalesContext);

export const SalesProvider = ({ children }) => {
  const [sales, setSales] = useState([]);

  return <SalesContext.Provider value={{ sales, setSales }}>{children}</SalesContext.Provider>;
};
