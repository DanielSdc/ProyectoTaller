// Importa la configuración de Firebase
import { deleteObject, app, auth, db, collection, addDoc, query, where, getDocs, orderBy, onAuthStateChanged, deleteDoc, doc, updateDoc, getDoc, storage, ref, uploadBytes, getDownloadURL } from './firebaseconfig.js';

let table;
let allFotos = []; // Define allFotos globally

$(document).ready(function () {
    table = $("#inmueblesTable").DataTable({
        language: {
            url: "//cdn.datatables.net/plug-ins/1.11.5/i18n/es-ES.json"
        },
    });

    // Inicializar el mapa de Leaflet
    const map = L.map('map').setView([24.805, -107.394], 12.3);

    // Añadir capa de mapa base
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Definir customIcon con Font Awesome
    const customIcon = L.divIcon({
        html: '<i class="fas fa-home fa-2x"></i>',
        className: 'custom-div-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
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
                        const popupContent = `
                            <b>${data.nombre}</b><br>${data.direccion}<br>
                            ${data.fotos && data.fotos.length > 0 ? `<img src="${data.fotos[0]}" width="100" height="100">` : ''}
                        `;
                        L.marker([lat, lng], { icon: customIcon })
                            .bindPopup(popupContent)
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
                    text: "¡No podrás revertir esto!",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#3085d6',
                    cancelButtonColor: '#d33',
                    confirmButtonText: 'Sí, eliminar',
                    cancelButtonText: 'Cancelar',
                    reverseButtons: true,
                    customClass: {
                        popup: 'swal-popup',
                        title: 'swal-title',
                        content: 'swal-text',
                    }
                });

                if (result.isConfirmed) {
                    await eliminarInmueble(id);
                    table.row($(this).parents('tr')).remove().draw();
                    Swal.fire({
                        icon: 'success',
                        title: 'Inmueble eliminado',
                        text: 'Tu inmueble ha sido eliminado exitosamente.',
                        customClass: {
                            popup: 'swal-popup',
                            title: 'swal-title',
                            content: 'swal-text',
                            confirmButton: 'swal-btn'
                        }
                    }).then(() => {
                        location.reload();
                    });
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

    // Disable the save button initially
    $("#inmuebleForm button[type='submit']").prop('disabled', true);

    // Real-time validation
    $("#inmuebleForm input[required]").on("input", function () {
        validateForm();
    });

    function validateForm() {
        let isValid = true;
        $("#inmuebleForm input[required]").each(function () {
            if ($(this).val() === "" || $(this).is(':disabled')) {
                $(this).addClass("is-invalid");
                $(this).next(".invalid-feedback").show();
                isValid = false;
            } else {
                $(this).removeClass("is-invalid");
                $(this).next(".invalid-feedback").hide();
            }
        });

        // Additional check for address and coordinates
        if ($("#direccion").val() === "") {
            $("#direccion").addClass("is-invalid");
            $("#direccion").next(".invalid-feedback").show();
            isValid = false;
        } else {
            $("#direccion").removeClass("is-invalid");
            $("#direccion").next(".invalid-feedback").hide();
        }
        if ($("#coordenadas").val() === "") {
            $("#coordenadas").addClass("is-invalid");
            $("#coordenadas").next(".invalid-feedback").show();
            isValid = false;
        } else {
            $("#coordenadas").removeClass("is-invalid");
            $("#coordenadas").next(".invalid-feedback").hide();
        }

        // Check for tamano and valor
        if ($("#tamano").val() === "") {
            $("#tamano").addClass("is-invalid");
            $("#tamano").closest('.input-group').find('.invalid-feedback').show();
            isValid = false;
        } else {
            $("#tamano").removeClass("is-invalid");
            $("#tamano").closest('.input-group').find('.invalid-feedback').hide();
        }
        if ($("#valor").val() === "") {
            $("#valor").addClass("is-invalid");
            $("#valor").closest('.input-group').find('.invalid-feedback').show();
            isValid = false;
        } else {
            $("#valor").removeClass("is-invalid");
            $("#valor").closest('.input-group').find('.invalid-feedback').hide();
        }

        $("#inmuebleForm button[type='submit']").prop('disabled', !isValid);
    }

    // Manejar el formulario de agregar/editar inmueble
    $("#inmuebleForm").on("submit", async function (event) {
        event.preventDefault();

        // Validate inputs
        validateForm();
        if ($("#inmuebleForm .is-invalid").length > 0) {
            return;
        }

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

                    Swal.fire({
                        icon: 'success',
                        title: 'Inmueble actualizado',
                        text: 'El inmueble se ha actualizado correctamente.',
                        customClass: {
                            popup: 'swal-popup',
                            title: 'swal-title',
                            content: 'swal-text',
                            confirmButton: 'swal-btn'
                        }
                    }).then(() => {
                        location.reload();
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

                    Swal.fire({
                        icon: 'success',
                        title: 'Inmueble agregado',
                        text: 'El inmueble se ha agregado correctamente.',
                        customClass: {
                            popup: 'swal-popup',
                            title: 'swal-title',
                            content: 'swal-text',
                            confirmButton: 'swal-btn'
                        }
                    }).then(() => {
                        location.reload();
                    });
                }
            } catch (error) {
                console.error("Error saving document: ", error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Hubo un error al guardar el inmueble.',
                    customClass: {
                        popup: 'swal-popup',
                        title: 'swal-title',
                        content: 'swal-text',
                        confirmButton: 'swal-btn'
                    }
                });
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

    // Clear error messages when the modal is closed
    $('#inmuebleModal').on('hidden.bs.modal', function () {
        const modal = $(this);
        modal.find('#inmuebleForm')[0].reset();
        modal.find('#currentFoto').attr('src', '').hide();
        modal.find('#inmuebleId').val('');
        modal.find('.is-invalid').removeClass('is-invalid');
        modal.find('.invalid-feedback').hide();
        validateForm(); // Ensure form validation is reset
    });

    // Clear error messages when the location is saved
    $('#saveLocationBtn').on('click', function () {
        $('#direccion').removeClass('is-invalid');
        $('#direccion').next('.invalid-feedback').hide();
        $('#coordenadas').removeClass('is-invalid');
        $('#coordenadas').next('.invalid-feedback').hide();
        validateForm();
    });

    // Clear error messages when the location is saved
    $('#saveLocationBtn').on('click', function () {
        $('#direccion').removeClass('is-invalid');
        $('#direccion').next('.invalid-feedback').hide();
        validateForm();
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

        // Clear error messages
        const modal = $("#inmuebleModal");
        modal.find('.is-invalid').removeClass('is-invalid');
        modal.find('.invalid-feedback').hide();
        validateForm();
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
            modal.find('.is-invalid').removeClass('is-invalid');
            modal.find('.invalid-feedback').hide();
        }
    });

    // Limpiar el modal al cerrar
    $('#inmuebleModal').on('hidden.bs.modal', function () {
        const modal = $(this);
        modal.find('#inmuebleForm')[0].reset();
        modal.find('#currentFoto').attr('src', '').hide();
        modal.find('#inmuebleId').val('');
    });

    document
        .getElementById("saveLocationBtn")
        .addEventListener("click", function () {
            if (selectedCoords && selectedAddress) {
                const coordenadasInput = document.getElementById("coordenadas");
                const direccionInput = document.getElementById("direccion");
                coordenadasInput.value = `${selectedCoords.lat}, ${selectedCoords.lng}`;
                direccionInput.value = selectedAddress;
                coordenadasInput.disabled = false;
                direccionInput.disabled = false;
                coordenadasInput.dispatchEvent(new Event('input'));
                direccionInput.dispatchEvent(new Event('input'));
                coordenadasInput.disabled = true;
                direccionInput.disabled = true;
                bootstrap.Modal.getInstance(document.getElementById("locationModal")).hide();
                validateForm();
            }
        });

    // Trigger validation when the coordinates and address are programmatically filled
    $("#coordenadas, #direccion").on("input", function () {
        validateForm();
    });

    // Manually trigger input event after setting values
    document.getElementById("saveLocationBtn").addEventListener("click", function () {
        if (selectedCoords && selectedAddress) {
            const coordenadasInput = document.getElementById("coordenadas");
            const direccionInput = document.getElementById("direccion");
            coordenadasInput.value = `${selectedCoords.lat}, ${selectedCoords.lng}`;
            direccionInput.value = selectedAddress;
            coordenadasInput.dispatchEvent(new Event('input'));
            direccionInput.dispatchEvent(new Event('input'));
        }
    });
});

async function eliminarInmueble(id) {
    try {
        const docRef = doc(db, "inmuebles", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.fotos && data.fotos.length > 0) {
                for (const fotoUrl of data.fotos) {
                    const fotoRef = ref(storage, fotoUrl);
                    await deleteObject(fotoRef); // Eliminar la imagen del almacenamiento
                }
            }
        }

        await deleteDoc(docRef); // Eliminar el documento de Firestore
        console.log(`Inmueble con ID ${id} eliminado.`);
        Swal.fire({
            icon: 'success',
            title: 'Inmueble eliminado',
            text: 'El inmueble y sus imágenes han sido eliminados exitosamente.',
            customClass: {
                popup: 'swal-popup',
                title: 'swal-title',
                content: 'swal-text',
                confirmButton: 'swal-btn'
            }
        });
    } catch (error) {
        console.error("Error al eliminar el inmueble:", error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Hubo un error al eliminar el inmueble.',
            customClass: {
                popup: 'swal-popup',
                title: 'swal-title',
                content: 'swal-text',
                confirmButton: 'swal-btn'
            }
        });
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

let selectedCoords = null;
let selectedAddress = null;
const selectMap = L.map("selectMap").setView([24.805, -107.394], 13);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(selectMap);

let marker = null;
selectMap.on("click", function (e) {
    if (marker) {
        selectMap.removeLayer(marker);
    }
    marker = L.marker(e.latlng).addTo(selectMap);
    selectedCoords = e.latlng;

    // Reverse geocoding
    fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${selectedCoords.lat}&lon=${selectedCoords.lng}`
    )
        .then((response) => response.json())
        .then((data) => {
            selectedAddress = data.display_name;
        })
        .catch((error) =>
            console.error("Error in reverse geocoding:", error)
        );
});

document
    .getElementById("selectLocationBtn")
    .addEventListener("click", function () {
        new bootstrap.Modal(document.getElementById("locationModal")).show();
    });

document
    .getElementById("saveLocationBtn")
    .addEventListener("click", function () {
        if (selectedCoords && selectedAddress) {
            document.getElementById("coordenadas").value = `${selectedCoords.lat}, ${selectedCoords.lng}`;
            document.getElementById("direccion").value = selectedAddress;
            $('#direccion').removeClass('is-invalid');
            $('#direccion').next('.invalid-feedback').hide();
            $('#coordenadas').removeClass('is-invalid');
            $('#coordenadas').next('.invalid-feedback').hide();
            bootstrap.Modal.getInstance(document.getElementById("locationModal")).hide();
            validateForm();
        }
    });

// Clear selectedCoords, selectedAddress, and remove marker when the modal is closed without saving
$("#locationModal").on("hidden.bs.modal", function () {
    selectedCoords = null;
    selectedAddress = null;
    if (marker) {
        selectMap.removeLayer(marker);
        marker = null;
    }
});

// Redimensionar el mapa cuando el modal se muestre
$("#locationModal").on("shown.bs.modal", function () {
    setTimeout(function () {
        selectMap.invalidateSize();
    }, 10);
});