// Importa la configuración de Firebase
import { app, auth, db, collection, addDoc, query, where, getDocs, orderBy, onAuthStateChanged, deleteDoc, doc, updateDoc, getDoc, storage, ref, uploadBytes, getDownloadURL } from './firebaseconfig.js';

let table;
let allFotos = []; // Define allFotos globally

$(document).ready(function () {
  table = $("#inmueblesTable").DataTable({
    language: {
      url: "//cdn.datatables.net/plug-ins/1.11.5/i18n/es-ES.json"
    },
  });

  // Inicializar el mapa de Leaflet
  const map = L.map('map').setView([24.805, -107.394], 13);

  // Añadir capa de mapa base
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  // Definir customIcon
  const customIcon = L.icon({
    iconUrl: '../img/house.png',
    iconSize: [38, 95],
    iconAnchor: [22, 94],
    popupAnchor: [-3, -76]
  });

  // Localizaciones y galería de imágenes
  const localizaciones = [
    { nombre: "Casa Ejemplo 1", coords: [24.805, -107.394], descripcion: "Casa en renta" },
    { nombre: "Casa Ejemplo 2", coords: [24.813, -107.395], descripcion: "Casa en renta" },
    { nombre: "Casa Ejemplo 3", coords: [24.823, -107.405], descripcion: "Casa en renta" },
    { nombre: "Casa Ejemplo 4", coords: [24.799, -107.387], descripcion: "Casa en renta" },
  ];

  localizaciones.forEach((ubicacion) => {
    L.marker(ubicacion.coords, { icon: customIcon })
      .bindPopup(`<b>${ubicacion.nombre}</b><br>${ubicacion.descripcion}`)
      .addTo(map);
  });

  // Cargar inmuebles del usuario
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const q = query(
        collection(db, "inmuebles"),
        where("usuarioId", "==", user.uid),
        orderBy("fechaCreacion", "desc")
      );

      const querySnapshot = await getDocs(q);
      allFotos = []; // Initialize allFotos
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (Array.isArray(data.fotos)) {
          allFotos.push(...data.fotos);
        }
        table.row.add([
          data.nombre,
          data.ubicacion,
          `${data.tamano} m2`,
          data.cuartos,
          data.banos,
          `$${data.valor}`,
          data.fotos.map(url => `<img src="${url}" width="50" height="50">`).join(' '),
          `<button class="btn btn-sm btn-warning btn-edit" data-id="${doc.id}"><i class="fas fa-edit"></i> Editar</button>
           <button class="btn btn-sm btn-danger btn-delete" data-id="${doc.id}"><i class="fas fa-trash"></i> Eliminar</button>`,
        ]).draw(false);
      });

      mostrarFotos(allFotos);

      // Agregar eventos a los botones de eliminar y editar
      $("#inmueblesTable tbody").on("click", ".btn-delete", async function () {
        const id = $(this).data("id");
        await eliminarInmueble(id);
        table.row($(this).parents('tr')).remove().draw();
      });

      $("#inmueblesTable tbody").on("click", ".btn-edit", async function () {
        const id = $(this).data("id");
        const inmuebleDoc = await getDoc(doc(db, "inmuebles", id));
        if (inmuebleDoc.exists()) {
          const inmueble = inmuebleDoc.data();
          inmueble.id = id; // Agregar manualmente el ID al objeto inmueble
          abrirModalEditar(inmueble);
        } else {
          console.error("El documento no existe.");
        }
      });
    }
  });

  // Manejar el formulario de agregar inmueble
  $("#inmuebleForm").on("submit", async function (event) {
    event.preventDefault();

    const nombre = $("#nombre").val();
    const ubicacion = $("#ubicacion").val();
    const tamano = $("#tamano").val();
    const cuartos = $("#cuartos").val();
    const banos = $("#banos").val();
    const valor = $("#valor").val();
    const fotos = $("#fotos")[0].files;

    const user = auth.currentUser;
    if (user) {
      try {
        const fotoURLs = await Promise.all([...fotos].map(async (foto) => {
          const fotoRef = ref(storage, `inmuebles/${user.uid}/${foto.name}`);
          await uploadBytes(fotoRef, foto);
          return await getDownloadURL(fotoRef);
        }));

        await addDoc(collection(db, "inmuebles"), {
          usuarioId: user.uid,
          nombre,
          ubicacion,
          tamano,
          cuartos,
          banos,
          valor,
          fotos: fotoURLs,
          fechaCreacion: new Date()
        });

        location.reload();
      } catch (error) {
        console.error("Error adding document: ", error);
      }
    }
  });

  // Manejar el formulario de editar inmueble
  $("#editInmuebleForm").on("submit", async function (event) {
    event.preventDefault();

    const id = $("#editInmuebleId").val();
    const nombre = $("#editNombre").val();
    const ubicacion = $("#editUbicacion").val();
    const tamano = $("#editTamano").val();
    const cuartos = $("#editCuartos").val();
    const banos = $("#editBanos").val();
    const valor = $("#editValor").val();
    const fotos = $("#editFotos")[0].files;

    if (!id) {
      alert("No se encontró un ID válido para el inmueble.");
      return;
    }

    const user = auth.currentUser;
    if (user) {
      try {
        let fotoURLs = [];
        if (fotos.length > 0) {
          fotoURLs = await Promise.all([...fotos].map(async (foto) => {
            const fotoRef = ref(storage, `inmuebles/${user.uid}/${foto.name}`);
            await uploadBytes(fotoRef, foto);
            return await getDownloadURL(fotoRef);
          }));
        } else {
          const inmuebleDoc = await getDoc(doc(db, "inmuebles", id));
          if (inmuebleDoc.exists()) {
            const inmueble = inmuebleDoc.data();
            fotoURLs = inmueble.fotos || [];
          }
        }

        await updateDoc(doc(db, "inmuebles", id), {
          nombre,
          ubicacion,
          tamano,
          cuartos,
          banos,
          valor,
          fotos: fotoURLs,
          fechaActualizacion: new Date()
        });

        location.reload();
      } catch (error) {
        console.error("Error updating document: ", error);
      }
    }
  });
});

async function eliminarInmueble(id) {
  try {
    await deleteDoc(doc(db, "inmuebles", id));
  } catch (error) {
    console.error("Error deleting document: ", error);
  }
}

async function obtenerInmueble(id) {
  try {
    const docSnap = await getDoc(doc(db, "inmuebles", id));
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      console.log("No such document!");
    }
  } catch (error) {
    console.error("Error getting document: ", error);
  }
}

function abrirModalEditar(inmueble) {
  $("#editInmuebleId").val(inmueble.id);
  $("#editNombre").val(inmueble.nombre);
  $("#editUbicacion").val(inmueble.ubicacion);
  $("#editTamano").val(inmueble.tamano);
  $("#editCuartos").val(inmueble.cuartos);
  $("#editBanos").val(inmueble.banos);
  $("#editValor").val(inmueble.valor);
  if (inmueble.fotos && inmueble.fotos.length > 0) {
    $("#currentEditFoto").attr("src", inmueble.fotos[0]).show();
  } else {
    $("#currentEditFoto").hide();
  }
  $("#editInmuebleModal").modal("show");
}

const imagesPerPage = 6;
let currentImagePage = 1;
let totalImages = 0;

function mostrarFotos(fotos) {
  const gallery = document.querySelector(".image-gallery");
  gallery.innerHTML = ''; // Limpiar la galería antes de agregar nuevas fotos

  totalImages = fotos.length;
  const totalPages = Math.ceil(totalImages / imagesPerPage);

  if (totalImages === 0) {
    gallery.innerHTML = `<div class="alert alert-info" role="alert">No hay fotos disponibles.</div>`;
    return;
  }

  const start = (currentImagePage - 1) * imagesPerPage;
  const end = start + imagesPerPage;
  const fotosPagina = fotos.slice(start, end);

  fotosPagina.forEach((fotoUrl) => {
    const img = document.createElement("img");
    img.src = fotoUrl;
    img.classList.add("gallery-image");

    img.addEventListener("click", () => {
      document.getElementById("modalImage").src = fotoUrl;
      new bootstrap.Modal(document.getElementById("imageModal")).show();
    });

    gallery.appendChild(img);
  });

  // Actualizar la información de paginación
  document.getElementById("imagePageInfo").textContent = `Página ${currentImagePage} de ${totalPages}`;
  document.getElementById("prevImagePage").disabled = currentImagePage === 1;
  document.getElementById("nextImagePage").disabled = currentImagePage === totalPages;
}

// Eventos para los botones de paginación de imágenes
document.getElementById("prevImagePage").addEventListener("click", () => {
  if (currentImagePage > 1) {
    currentImagePage--;
    mostrarFotos(allFotos);
  }
});

document.getElementById("nextImagePage").addEventListener("click", () => {
  const totalPages = Math.ceil(totalImages / imagesPerPage);
  if (currentImagePage < totalPages) {
    currentImagePage++;
    mostrarFotos(allFotos);
  }
});
