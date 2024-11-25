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

  // Definir customIcon con dimensiones mejoradas
  const customIcon = L.icon({
    iconUrl: '../img/house.png',
    iconSize: [32, 32], // Ajustar el tamaño del icono
    iconAnchor: [16, 32], // Ajustar el ancla del icono
    popupAnchor: [0, -32] // Ajustar el ancla del popup
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
          data.nombre || '',
          data.direccion || '',
         /*  data.coordenadas || '', */
          `${data.tamano || 0} m2`,
          data.cuartos || 0,
          data.banos || 0,
          `$${data.valor || 0}`,
          data.fotos ? data.fotos.map(url => `<img src="${url}" width="50" height="50">`).join(' ') : '',
          `<div class="d-flex justify-content-center align-items-center">
          <button class="btn btn-sm btn-warning btn-edit me-2" data-id="${doc.id}"><i class="fas fa-edit fa-2x"></i></button>
          <button class="btn btn-sm btn-danger btn-delete" data-id="${doc.id}"><i class="fas fa-trash fa-2x"></i></button>
        </div>`
        ]).draw(false);

        // Add marker to the map
        if (data.coordenadas) {
          const [lat, lng] = data.coordenadas.split(',').map(Number);
          if (!isNaN(lat) && !isNaN(lng)) {
            L.marker([lat, lng], { icon: customIcon })
              .bindPopup(`<b>${data.nombre}</b><br>${data.direccion}`)
              .addTo(map);
          } else {
            console.error(`Invalid coordinates for property: ${data.nombre}`);
          }
        }
      });

      mostrarFotos(allFotos);

      // Agregar eventos a los botones de eliminar y editar
      $("#inmueblesTable tbody").on("click", ".btn-delete", async function () {
        const id = $(this).data("id");
        const result = await Swal.fire({
          title: '¿Estás seguro?',
          text: "No podrás revertir esto!",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Sí, eliminarlo!',
          cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
          await eliminarInmueble(id);
          table.row($(this).parents('tr')).remove().draw();
          Swal.fire(
            'Eliminado!',
            'El inmueble ha sido eliminado.',
            'success'
          );
        }
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

  // Manejar el formulario de agregar/editar inmueble
  $("#inmuebleForm").on("submit", async function (event) {
    event.preventDefault();

    const id = $("#inmuebleId").val();
    const nombre = $("#nombre").val();
    const direccion = $("#direccion").val();
    const coordenadas = $("#coordenadas").val();
    const tamano = $("#tamano").val();
    const cuartos = $("#cuartos").val();
    const banos = $("#banos").val();
    const valor = $("#valor").val();
    const fotos = $("#fotos")[0].files;

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
        }

        if (id) {
          // Editar inmueble
          const inmuebleDoc = await getDoc(doc(db, "inmuebles", id));
          if (inmuebleDoc.exists()) {
            const inmueble = inmuebleDoc.data();
            fotoURLs = fotoURLs.length > 0 ? fotoURLs : inmueble.fotos || [];
          }

          await updateDoc(doc(db, "inmuebles", id), {
            nombre,
            direccion,
            coordenadas,
            tamano,
            cuartos,
            banos,
            valor,
            fotos: fotoURLs,
            fechaActualizacion: new Date()
          });
        } else {
          // Agregar inmueble
          await addDoc(collection(db, "inmuebles"), {
            usuarioId: user.uid,
            nombre,
            direccion,
            coordenadas,
            tamano,
            cuartos,
            banos,
            valor,
            fotos: fotoURLs,
            fechaCreacion: new Date()
          });
        }

        location.reload();
      } catch (error) {
        console.error("Error saving document: ", error);
      }
    }
  });

  // Mostrar la foto seleccionada en el input
  $("#fotos").on("change", function () {
    const file = this.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        $("#currentFoto").attr("src", e.target.result).show();
      };
      reader.readAsDataURL(file);
    }
  });

  // Manejar el formulario de editar inmueble
  $("#editInmuebleForm").on("submit", async function (event) {
    event.preventDefault();

    const id = $("#editInmuebleId").val();
    const nombre = $("#editNombre").val();
    const direccion = $("#editDireccion").val();
    const coordenadas = $("#editCoordenadas").val();
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
          direccion,
          coordenadas,
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

  function abrirModalEditar(inmueble) {
    $("#inmuebleId").val(inmueble.id);
    $("#nombre").val(inmueble.nombre);
    $("#direccion").val(inmueble.direccion);
    $("#coordenadas").val(inmueble.coordenadas);
    $("#tamano").val(inmueble.tamano);
    $("#cuartos").val(inmueble.cuartos);
    $("#banos").val(inmueble.banos);
    $("#valor").val(inmueble.valor);
    if (inmueble.fotos && inmueble.fotos.length > 0) {
      $("#currentFoto").attr("src", inmueble.fotos[0]).show();
    } else {
      $("#currentFoto").hide();
    }
    $("#inmuebleModalLabel").text("Editar Inmueble");
    $("#inmuebleModal").modal("show");
  }

  // Inicializar el modal al abrir
  $('#inmuebleModal').on('show.bs.modal', function (event) {
    const button = $(event.relatedTarget);
    const modal = $(this);
    if (button.data('bs-target') === '#inmuebleModal') {
      modal.find('.modal-title').text('Agregar Inmueble');
      modal.find('#inmuebleForm')[0].reset();
      modal.find('#currentFoto').attr('src', '').hide();
      modal.find('#inmuebleId').val('');
    }
  });

  // Limpiar el modal al cerrar
  $('#inmuebleModal').on('hidden.bs.modal', function () {
    const modal = $(this);
    modal.find('#inmuebleForm')[0].reset();
    modal.find('#currentFoto').attr('src', '').hide();
    modal.find('#inmuebleId').val('');
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
