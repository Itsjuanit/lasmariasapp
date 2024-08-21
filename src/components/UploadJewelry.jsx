import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { collection, addDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import { db, storage } from "../firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Toast } from "primereact/toast";
import { FileUpload } from "primereact/fileupload";
import "primeflex/primeflex.css"; // Asegúrate de tener PrimeFlex instalado

const UploadJewelry = () => {
  const { id } = useParams();
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    purchasePrice: "",
    salePrice: "",
    quantity: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editing, setEditing] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    const fetchJoya = async () => {
      if (id) {
        setEditing(true);
        const docRef = doc(db, "jewelry", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData({
            name: data.name || "",
            type: data.type || "",
            purchasePrice: data.purchasePrice || "",
            salePrice: data.salePrice || "",
            quantity: data.quantity || "",
          });
          setImageUrl(data.image || "");
        } else {
          setError("No se encontraron datos para esta joya.");
        }
      }
    };

    fetchJoya();
  }, [id]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageChange = (e) => {
    setImageFile(e.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      let newImageUrl = imageUrl;

      if (imageFile) {
        // Subir imagen a Firebase Storage
        const imageRef = ref(storage, `images/${imageFile.name + uuidv4()}`);
        const snapshot = await uploadBytes(imageRef, imageFile);
        newImageUrl = await getDownloadURL(snapshot.ref);
      }

      if (editing) {
        const jewelryRef = doc(db, "jewelry", id);
        await updateDoc(jewelryRef, {
          name: formData.name,
          type: formData.type,
          purchasePrice: parseFloat(formData.purchasePrice),
          salePrice: parseFloat(formData.salePrice),
          quantity: parseInt(formData.quantity, 10),
          image: newImageUrl,
        });
        setSuccess("La joya fue actualizada con éxito.");
      } else {
        await addDoc(collection(db, "jewelry"), {
          name: formData.name || "Sin nombre",
          type: formData.type || "Sin tipo",
          purchasePrice: parseFloat(formData.purchasePrice) || 0,
          salePrice: parseFloat(formData.salePrice) || 0,
          quantity: parseInt(formData.quantity, 10) || 0,
          image: newImageUrl || "URL de imagen por defecto",
        });
        setSuccess("La joya fue subida con éxito.");
      }

      setFormData({
        name: "",
        type: "",
        purchasePrice: "",
        salePrice: "",
        quantity: "",
      });
      setImageFile(null);
      setImageUrl("");
    } catch (error) {
      setError("Error al procesar la joya: " + error.message);
    }
  };

  return (
    <div className="flex justify-content-center align-items-center min-h-screen">
      <Card title={editing ? "Editar Joya" : "Subir Nueva Joya"} className="p-4 shadow-2 w-full md:w-6 lg:w-4">
        {error && <Toast severity="error" summary="Error" detail={error} life={3000} />}
        {success && <Toast severity="success" summary="Éxito" detail={success} life={3000} />}

        <form onSubmit={handleSubmit}>
          <div className="p-fluid grid">
            <div className="field col-12 md:col-6">
              <label htmlFor="name">Nombre del Producto</label>
              <InputText id="name" name="name" value={formData.name} onChange={handleChange} required />
            </div>

            <div className="field col-12 md:col-6">
              <label htmlFor="type">Tipo</label>
              <InputText id="type" name="type" value={formData.type} onChange={handleChange} required />
            </div>

            <div className="field col-12 md:col-6">
              <label htmlFor="purchasePrice">Precio de Compra</label>
              <InputNumber
                id="purchasePrice"
                name="purchasePrice"
                value={formData.purchasePrice}
                onValueChange={(e) => handleChange({ target: { name: "purchasePrice", value: e.value } })}
                required
              />
            </div>

            <div className="field col-12 md:col-6">
              <label htmlFor="salePrice">Precio de Venta</label>
              <InputNumber
                id="salePrice"
                name="salePrice"
                value={formData.salePrice}
                onValueChange={(e) => handleChange({ target: { name: "salePrice", value: e.value } })}
                required
              />
            </div>

            <div className="field col-12 md:col-6">
              <label htmlFor="quantity">Cantidad</label>
              <InputNumber
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onValueChange={(e) => handleChange({ target: { name: "quantity", value: e.value } })}
                required
              />
            </div>

            <div className="field col-12 md:col-6">
              <label htmlFor="image">Imagen</label>
              <FileUpload name="image" accept="image/*" customUpload auto chooseLabel="Subir Imagen" onSelect={handleImageChange} />
              {imageUrl && <img src={imageUrl} alt="Joya" width="100" className="mt-2" style={{ borderRadius: "8px" }} />}
            </div>
          </div>

          <Button label={editing ? "Actualizar Joya" : "Subir Joya"} icon="pi pi-check" className="w-full" type="submit" />
        </form>
      </Card>
    </div>
  );
};

export default UploadJewelry;
