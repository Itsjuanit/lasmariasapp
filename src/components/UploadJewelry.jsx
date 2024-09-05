import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { collection, addDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import { db, storage } from "../firebaseConfig";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Toast } from "primereact/toast";
import { FileUpload } from "primereact/fileupload";
import { ProgressBar } from "primereact/progressbar";
import { Dropdown } from "primereact/dropdown";
import "primeflex/primeflex.css";

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
  const [uploadProgress, setUploadProgress] = useState(0);

  const toast = useRef(null);
  const fileUploadRef = useRef(null);

  const typeOptions = [
    { label: "Anillo", value: "Anillo" },
    { label: "Anillo Cintillo", value: "Anillo Cintillo" },
    { label: "Aros", value: "Aros" },
    { label: "Aros Argolla", value: "Aros Argolla" },
    { label: "Aros Argolla Mediana", value: "Aros Argolla Mediana" },
    { label: "Aros Argolla Mini", value: "Aros Argolla Mini" },
    { label: "Aros Mini", value: "Aros Mini" },
    { label: "Cadena", value: "Cadena" },
    { label: "Conjunto", value: "Conjunto" },
    { label: "Dije", value: "Dije" },
    { label: "Gargantilla", value: "Gargantilla" },
    { label: "Pulsera", value: "Pulsera" },
    { label: "Tobillera", value: "Tobillera" },
  ];

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

  const handleDropdownChange = (e) => {
    setFormData({
      ...formData,
      type: e.value,
    });
  };

  const handleImageChange = (e) => {
    setImageFile(e.files[0]);
    console.log("Imagen seleccionada:", e.files[0]);
  };

  const handleDeleteImage = async () => {
    try {
      if (imageUrl) {
        const imageRef = ref(storage, imageUrl);
        await deleteObject(imageRef);
        setImageUrl("");
        setImageFile(null);
        toast.current.show({ severity: "success", summary: "Imagen eliminada", life: 3000 });
      }
    } catch (error) {
      setError("Error al eliminar la imagen: " + error.message);
      toast.current.show({ severity: "error", summary: "Error", detail: error.message, life: 3000 });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setUploadProgress(0);

    console.log("Enviando formulario con imagen:", imageFile);

    try {
      let newImageUrl = imageUrl;

      if (imageFile) {
        const imageRef = ref(storage, `images/${imageFile.name + uuidv4()}`);
        const uploadTask = uploadBytesResumable(imageRef, imageFile);

        const snapshot = await new Promise((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(progress);
              console.log(`Progreso de la carga: ${progress}%`);
            },
            (error) => {
              setError("Error al subir la imagen: " + error.message);
              toast.current.show({ severity: "error", summary: "Error", detail: error.message, life: 3000 });
              reject(error);
            },
            () => {
              resolve(uploadTask.snapshot);
            }
          );
        });

        newImageUrl = await getDownloadURL(snapshot.ref);
        setImageUrl(newImageUrl);
        setUploadProgress(100);
        console.log("Imagen subida correctamente, URL:", newImageUrl);
      }

      const jewelryData = {
        name: formData.name || "Sin nombre",
        type: formData.type || "Sin tipo",
        purchasePrice: parseFloat(formData.purchasePrice) || 0,
        salePrice: parseFloat(formData.salePrice) || 0,
        quantity: parseInt(formData.quantity, 10) || 0,
        image: newImageUrl || "URL de imagen por defecto",
      };

      if (editing) {
        const jewelryRef = doc(db, "jewelry", id);
        await updateDoc(jewelryRef, jewelryData);
        setSuccess("La joya fue actualizada con éxito.");
        toast.current.show({ severity: "success", summary: "Éxito", detail: "La joya fue actualizada con éxito", life: 3000 });
      } else {
        await addDoc(collection(db, "jewelry"), jewelryData);
        setSuccess("La joya fue subida con éxito.");
        toast.current.show({ severity: "success", summary: "Éxito", detail: "La joya fue subida con éxito", life: 3000 });
      }

      // Restablecer solo la imagen sin afectar los demás campos
      setImageFile(null);
      setUploadProgress(0);

      if (fileUploadRef.current) {
        fileUploadRef.current.clear();
      }
    } catch (error) {
      setError("Error al procesar la joya: " + error.message);
      toast.current.show({ severity: "error", summary: "Error", detail: error.message, life: 3000 });
    }
  };

  return (
    <div className="flex justify-content-center align-items-center min-h-screen">
      <Card title={editing ? "Editar Joya" : "Subir Nueva Joya"} className="p-4 shadow-2 w-full md:w-6 lg:w-4">
        <Toast ref={toast} />

        <form onSubmit={handleSubmit}>
          <div className="p-fluid grid">
            <div className="field col-12 md:col-6">
              <label htmlFor="name">Nombre del Producto</label>
              <InputText id="name" name="name" value={formData.name} onChange={handleChange} required />
            </div>

            <div className="field col-12 md:col-6">
              <label htmlFor="type">Tipo</label>
              <Dropdown
                id="type"
                name="type"
                value={formData.type}
                options={typeOptions}
                onChange={handleDropdownChange}
                placeholder="Seleccionar tipo"
                required
              />
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

            <div className="field col-12">
              <label htmlFor="image">Imagen</label>
              <FileUpload
                name="image"
                accept="image/*"
                customUpload
                auto
                chooseLabel="Subir Imagen"
                onSelect={handleImageChange}
                ref={fileUploadRef}
              />
              {imageUrl && (
                <div className="mt-2">
                  <img src={imageUrl} alt="Joya" width="100" style={{ borderRadius: "8px" }} />
                  <Button label="Eliminar Imagen" icon="pi pi-trash" className="p-button-danger mt-2" onClick={handleDeleteImage} />
                </div>
              )}
              {uploadProgress > 0 && <ProgressBar value={uploadProgress} className="mt-2" />}
            </div>
          </div>

          <Button
            label={editing ? "Actualizar Joya" : "Subir Joya"}
            icon="pi pi-check"
            className="w-full"
            type="submit"
            disabled={!imageFile && !imageUrl}
          />
        </form>
      </Card>
    </div>
  );
};

export default UploadJewelry;
