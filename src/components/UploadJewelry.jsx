import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { collection, addDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import { db, storage } from "../firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";
import { Container, TextField, Button, Grid, Typography, Alert, Card, CardContent } from "@mui/material";

const UploadJewelry = () => {
  const { id } = useParams(); // Captura el ID de la URL
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
  const [editing, setEditing] = useState(false); // Estado para saber si estamos editando
  const [imageUrl, setImageUrl] = useState(""); // Estado para la URL de la imagen cargada

  // Efecto para cargar los datos si estamos en modo edición
  useEffect(() => {
    const fetchJoya = async () => {
      if (id) {
        setEditing(true); // Estamos en modo edición
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
          setImageUrl(data.image || ""); // Almacenar la URL de la imagen existente
        } else {
          setError("No se encontraron datos para esta joya.");
        }
      }
    };

    fetchJoya();
  }, [id]);

  // Manejar cambios en los campos del formulario
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Manejar la carga de la imagen
  const handleImageChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  // Manejar el envío del formulario (creación o edición)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      let newImageUrl = imageUrl; // Si ya hay una URL de imagen, manténla

      // Si hay una nueva imagen seleccionada, súbela a Firebase Storage
      if (imageFile) {
        const imageRef = ref(storage, `images/${imageFile.name + uuidv4()}`);
        const snapshot = await uploadBytes(imageRef, imageFile);
        newImageUrl = await getDownloadURL(snapshot.ref); // Obtén la nueva URL de la imagen
      }

      if (editing) {
        // Si estamos en modo edición, actualiza el documento existente
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
        // Si no estamos en modo edición, crea un nuevo documento
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

      // Reiniciar el formulario
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
    <Grid
      container
      spacing={0}
      direction="column"
      alignItems="center"
      justifyContent="center"
      style={{ minHeight: "100vh", minWidth: "100vw" }}
    >
      <Grid item xs={12} sm={8} md={6}>
        <Container>
          <Card>
            <CardContent>
              <Typography variant="h4" align="center" gutterBottom>
                {editing ? "Editar Joya" : "Subir Nueva Joya"}
              </Typography>
              {error && <Alert severity="error">{error}</Alert>}
              {success && <Alert severity="success">{success}</Alert>}
              <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Nombre del Producto"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      variant="outlined"
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Tipo"
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      variant="outlined"
                      required
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Precio de Compra"
                      type="number"
                      name="purchasePrice"
                      value={formData.purchasePrice}
                      onChange={handleChange}
                      variant="outlined"
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Precio de Venta"
                      type="number"
                      name="salePrice"
                      value={formData.salePrice}
                      onChange={handleChange}
                      variant="outlined"
                      required
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} style={{ marginBottom: "50px" }}>
                    <TextField
                      fullWidth
                      label="Cantidad"
                      type="number"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleChange}
                      variant="outlined"
                      required
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Button variant="contained" component="label" fullWidth>
                      {imageUrl ? "Cambiar Imagen" : "Subir Imagen"}
                      <input type="file" hidden onChange={handleImageChange} accept="image/*" />
                    </Button>
                    {imageUrl && <img src={imageUrl} alt="Joya" width="100" style={{ marginTop: "10px", borderRadius: "8px" }} />}
                  </Grid>
                </Grid>

                <Button variant="contained" color="primary" type="submit" className="mt-4" fullWidth>
                  {editing ? "Actualizar Joya" : "Subir Joya"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </Container>
      </Grid>
    </Grid>
  );
};

export default UploadJewelry;
