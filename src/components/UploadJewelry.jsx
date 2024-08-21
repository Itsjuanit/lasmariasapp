import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { collection, addDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import { db, storage } from "../firebaseConfig";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Toast } from "primereact/toast";
import { FileUpload } from "primereact/fileupload";
import { ProgressBar } from "primereact/progressbar";
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
    setUploadProgress(0);

    try {
      let newImageUrl = imageUrl;

      if (imageFile) {
        // Subir imagen a Firebase Storage con progreso
        const imageRef = ref(storage, `images/${imageFile.name + uuidv4()}`);
        const uploadTask = uploadBytesResumable(imageRef, imageFile);

        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
          },
          (error) => {
            setError("Error al subir la imagen: " + error.message);
            toast.current.show({ severity: "error", summary: "Error", detail: error.message, life: 3000 });
          },
          async () => {
            // Obtener URL de la imagen subida
            newImageUrl = await getDownloadURL(uploadTask.snapshot.ref);
            setUploadProgress(100); // Completar la barra de progreso

            // Guardar en Firestore la URL de la imagen subida
            if (editing) {
              const jewelryRef = doc(db, "jewelry", id);
              await updateDoc(jewelryRef, {
                name: formData.name,
                type: formData.type,
                purchasePrice: parseFloat(formData.purchasePrice),
                salePrice: parseFloat(formData.salePrice),
                quantity: parseInt(formData.quantity, 10),
                image: newImageUrl, // Asignar correctamente la URL de la imagen
              });
              setSuccess("La joya fue actualizada con éxito.");
              toast.current.show({ severity: "success", summary: "Éxito", detail: "La joya fue actualizada con éxito", life: 3000 });
            } else {
              await addDoc(collection(db, "jewelry"), {
                name: formData.name || "Sin nombre",
                type: formData.type || "Sin tipo",
                purchasePrice: parseFloat(formData.purchasePrice) || 0,
                salePrice: parseFloat(formData.salePrice) || 0,
                quantity: parseInt(formData.quantity, 10) || 0,
                image: newImageUrl || "URL de imagen por defecto", // Guardar la URL obtenida
              });
              setSuccess("La joya fue subida con éxito.");
              toast.current.show({ severity: "success", summary: "Éxito", detail: "La joya fue subida con éxito", life: 3000 });
            }

            // Reiniciar formulario
            setFormData({
              name: "",
              type: "",
              purchasePrice: "",
              salePrice: "",
              quantity: "",
            });
            setImageFile(null); // Limpiar estado de imagen
            setImageUrl(""); // Limpiar URL de la imagen
            setUploadProgress(0); // Reiniciar progreso de carga

            // Limpiar FileUpload
            if (fileUploadRef.current) {
              fileUploadRef.current.clear(); // Limpiar el componente de subir archivo
            }
          }
        );
      }
    } catch (error) {
      setError("Error al procesar la joya: " + error.message);
      toast.current.show({ severity: "error", summary: "Error", detail: error.message, life: 3000 });
    }
  };

  return (
    <div className="flex justify-content-center align-items-center min-h-screen">
      <Card title={editing ? "Editar Joya" : "Subir Nueva Joya"} className="p-4 shadow-2 w-full md:w-6 lg:w-4">
        {/* Componente Toast */}
        <Toast ref={toast} />

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

            {/* Parte de Subir Imagen debajo de la cantidad */}
            <div className="field col-12">
              <label htmlFor="image">Imagen</label>
              <FileUpload
                name="image"
                accept="image/*"
                customUpload
                auto
                chooseLabel="Subir Imagen"
                onSelect={handleImageChange}
                ref={fileUploadRef} // Referencia al FileUpload
              />
              {imageUrl && <img src={imageUrl} alt="Joya" width="100" className="mt-2" style={{ borderRadius: "8px" }} />}
              {uploadProgress > 0 && <ProgressBar value={uploadProgress} className="mt-2" />}
            </div>
          </div>

          <Button label={editing ? "Actualizar Joya" : "Subir Joya"} icon="pi pi-check" className="w-full" type="submit" />
        </form>
      </Card>
    </div>
  );
};

export default UploadJewelry;
