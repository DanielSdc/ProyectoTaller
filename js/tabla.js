// Importa la configuración de Firebase
import { app, auth, db, collection, addDoc, query, where, getDocs, orderBy, onAuthStateChanged, deleteDoc, doc, updateDoc, getDoc } from './firebaseconfig.js';

let table;

$(document).ready(function () {
  table = $("#inmueblesTable").DataTable();

  // Cargar inmuebles del usuario
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const q = query(
        collection(db, "inmuebles"),
        where("usuarioId", "==", user.uid),
        orderBy("fechaCreacion", "desc")
      );

      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        table.row.add([
          data.nombre,
          data.ubicacion,
          `${data.tamano} m2`,
          data.cuartos,
          data.banos,
          `$${data.valor}`,
          data.fotos,
          `<button class="btn btn-sm btn-warning btn-edit" data-id="${doc.id}"><i class="fas fa-edit"></i> Editar</button>
           <button class="btn btn-sm btn-danger btn-delete" data-id="${doc.id}"><i class="fas fa-trash"></i> Eliminar</button>`,
        ]).draw(false);
      });

      // Agregar eventos a los botones de eliminar y editar
      $("#inmueblesTable tbody").on("click", ".btn-delete", async function () {
        const id = $(this).data("id");
        await eliminarInmueble(id);
        table.row($(this).parents('tr')).remove().draw();
      });

      $("#inmueblesTable tbody").on("click", ".btn-edit", async function () {
        const id = $(this).data("id");
        const inmueble = await obtenerInmueble(id);
        abrirModalEditar(inmueble);
      });
    }
  });

  $("#inmuebleForm").on("submit", async function (event) {
    event.preventDefault();

    const nombre = $("#nombre").val();
    const ubicacion = $("#ubicacion").val();
    const tamano = $("#tamano").val();
    const cuartos = $("#cuartos").val();
    const banos = $("#banos").val();
    const valor = $("#valor").val();
    const fotos = $("#fotos").val();

    const user = auth.currentUser;
    if (user) {
      try {
        await addDoc(collection(db, "inmuebles"), {
          usuarioId: user.uid,
          nombre,
          ubicacion,
          tamano,
          cuartos,
          banos,
          valor,
          fotos,
          fechaCreacion: new Date()
        });

        table.row.add([
          nombre,
          ubicacion,
          `${tamano} m2`,
          cuartos,
          banos,
          `$${valor}`,
          fotos,
          `<button class="btn btn-sm btn-warning btn-edit"><i class="fas fa-edit"></i> Editar</button>
           <button class="btn btn-sm btn-danger btn-delete"><i class="fas fa-trash"></i> Eliminar</button>`,
        ]).draw(false);

        $("#inmuebleForm")[0].reset();
        $("#addInmuebleModal").modal("hide");
      } catch (error) {
        console.error("Error al agregar inmueble:", error);
        alert("Hubo un error al agregar el inmueble.");
      }
    } else {
      alert("Debes iniciar sesión para agregar inmuebles.");
    }
  });
});

// Función para eliminar un inmueble
async function eliminarInmueble(id) {
  try {
    await deleteDoc(doc(db, "inmuebles", id));
    console.log(`Inmueble con ID ${id} eliminado.`);
    alert("Inmueble eliminado exitosamente.");
  } catch (error) {
    console.error("Error al eliminar el inmueble:", error);
    alert("Hubo un error al eliminar el inmueble.");
  }
}

// Función para obtener un inmueble
async function obtenerInmueble(id) {
  try {
    const docRef = doc(db, "inmuebles", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      console.log("No such document!");
    }
  } catch (error) {
    console.error("Error al obtener el inmueble:", error);
  }
}

// Función para abrir el modal de edición
function abrirModalEditar(inmueble) {
  $("#editInmuebleModal").modal("show");
  $("#editInmuebleId").val(inmueble.id);
  $("#editNombre").val(inmueble.nombre);
  $("#editUbicacion").val(inmueble.ubicacion);
  $("#editTamano").val(inmueble.tamano);
  $("#editCuartos").val(inmueble.cuartos);
  $("#editBanos").val(inmueble.banos);
  $("#editValor").val(inmueble.valor);
  $("#editFotos").val("");
}

// Función para actualizar un inmueble
$("#editInmuebleForm").on("submit", async function (event) {
  event.preventDefault();

  const id = $("#editInmuebleId").val();
  const nombre = $("#editNombre").val();
  const ubicacion = $("#editUbicacion").val();
  const tamano = $("#editTamano").val();
  const cuartos = $("#editCuartos").val();
  const banos = $("#editBanos").val();
  const valor = $("#editValor").val();
  const fotos = $("#editFotos").val();

  try {
    const docRef = doc(db, "inmuebles", id);
    await updateDoc(docRef, {
      nombre,
      ubicacion,
      tamano,
      cuartos,
      banos,
      valor,
      fotos
    });

    // Actualizar la fila en la tabla
    const row = $(`#inmueblesTable button[data-id='${id}']`).parents('tr');
    table.row(row).data([
      nombre,
      ubicacion,
      `${tamano} m2`,
      cuartos,
      banos,
      `$${valor}`,
      fotos,
      `<button class="btn btn-sm btn-warning btn-edit" data-id="${id}"><i class="fas fa-edit"></i> Editar</button>
       <button class="btn btn-sm btn-danger btn-delete" data-id="${id}"><i class="fas fa-trash"></i> Eliminar</button>`
    ]).draw(false);

    $("#editInmuebleModal").modal("hide");
    alert("Inmueble actualizado exitosamente.");
  } catch (error) {
    console.error("Error al actualizar el inmueble:", error);
    alert("Hubo un error al actualizar el inmueble.");
  }
});

// Mapa
const map = L.map("map").setView([24.8074, -107.394], 13);

// OpenStreetMap
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors",
}).addTo(map);

// icono personalizado
const customIcon = L.icon({
  iconUrl: "../img/house.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// Localizaciones
const localizaciones = [
  {
    nombre: "Casa Ejemplo 1",
    coords: [24.8074, -107.394],
    descripcion: "Casa en renta",
  },
  {
    nombre: "Casa Ejemplo 2",
    coords: [24.815, -107.398],
    descripcion: "Casa en renta",
  },
  {
    nombre: "Casa Ejemplo 3",
    coords: [24.823, -107.405],
    descripcion: "Casa en renta",
  },
  {
    nombre: "Casa Ejemplo 4",
    coords: [24.799, -107.387],
    descripcion: "Casa en renta",
  },
];

// Marcadores
localizaciones.forEach((ubicacion) => {
  L.marker(ubicacion.coords, { icon: customIcon })
    .bindPopup(`<b>${ubicacion.nombre}</b><br>${ubicacion.descripcion}`)
    .addTo(map);
});

// galeria de imagenes
const images = [
  "../img/casa1.jpg",
  "../img/casa2.jpg",
  "../img/casa3.jpg",
  "../img/casa4.png",
  "../img/casa5.png",
  "../img/casa1.jpg",
];

// Cargar imagenes en la galeria
const gallery = document.querySelector(".image-gallery");
images.forEach((imageSrc) => {
  const img = document.createElement("img");
  img.src = imageSrc;
  img.classList.add("gallery-image");
  img.addEventListener("click", () => {
    document.getElementById("modalImage").src = imageSrc;
    new bootstrap.Modal(document.getElementById("imageModal")).show();
  });
  gallery.appendChild(img);
});