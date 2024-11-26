// Importar Firestore y Auth desde firebaseconfig.js
import { db, auth } from "../js/firebaseconfig.js";
import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    deleteDoc,
    doc,
    orderBy,
    updateDoc // Import updateDoc
} from "../js/firebaseconfig.js";

const userEmail = localStorage.getItem('userEmail');
if (userEmail) {
    document.getElementById('user-email').textContent = userEmail;
} else {
    document.getElementById('user-email').textContent = 'Usuario no autenticado';
}

// Función para obtener el usuario autenticado
function obtenerUsuarioActual() {
    return new Promise((resolve, reject) => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            unsubscribe();
            if (user) {
                resolve(user);
            } else {
                reject(new Error("No hay un usuario autenticado."));
            }
        });
    });
}

// Función para guardar una nota
async function guardarNota(titulo, contenido) {
    const usuario = await obtenerUsuarioActual();

    if (!usuario) {
        console.error("No hay un usuario autenticado.");
        alert("Debes iniciar sesión para guardar notas.");
        return;
    }
    try {
        const docRef = await addDoc(collection(db, "notas"), {
            titulo: titulo, // Add title
            contenido: contenido,
            usuarioId: usuario.uid, // ID del usuario autenticado
            fechaCreacion: new Date(), // Timestamp
            fechaModificacion: new Date() // Add modification date
        });
        console.log("Nota guardada con ID:", docRef.id);
        Swal.fire({
            icon: 'success',
            title: 'Nota guardada',
            text: 'Tu nota ha sido guardada exitosamente.',
            customClass: {
                popup: 'swal-popup',
                title: 'swal-title',
                content: 'swal-text',
                confirmButton: 'swal-btn'
            }
        });
        cargarNotas(); // Actualiza la lista de notas
    } catch (error) {
        console.error("Error al guardar la nota:", error);
        alert("Hubo un error al guardar la nota.");
    }
}

// Función para obtener notas del usuario autenticado
async function obtenerNotas() {
    const usuario = await obtenerUsuarioActual();

    if (!usuario) {
        console.error("No hay un usuario autenticado.");
        alert("Debes iniciar sesión para ver tus notas.");
        return [];
    }

    try {
        const q = query(
            collection(db, "notas"),
            where("usuarioId", "==", usuario.uid),
            orderBy("fechaCreacion", "desc") // Ordenar por fecha de creación
        );

        const querySnapshot = await getDocs(q);
        const notas = [];
        querySnapshot.forEach((doc) => {
            notas.push({ id: doc.id, ...doc.data() });
        });

        console.log("Notas obtenidas:", notas);
        return notas;
    } catch (error) {
        console.error("Error al obtener notas:", error);
        alert("Hubo un error al obtener las notas.");
        return [];
    }
}

// Función para eliminar una nota
async function eliminarNota(notaId) {
    try {
        await deleteDoc(doc(db, "notas", notaId));
        console.log(`Nota con ID ${notaId} eliminada.`);
        Swal.fire({
            icon: 'success',
            title: 'Nota eliminada',
            text: 'Tu nota ha sido eliminada exitosamente.',
            customClass: {
                popup: 'swal-popup',
                title: 'swal-title',
                content: 'swal-text',
                confirmButton: 'swal-btn'
            }
        });
        cargarNotas(); // Actualiza la lista de notas
    } catch (error) {
        console.error("Error al eliminar la nota:", error);
        alert("Hubo un error al eliminar la nota.");
    }
}

// Función para actualizar una nota
async function actualizarNota(notaId, titulo, contenido) {
    try {
        const notaRef = doc(db, "notas", notaId);
        await updateDoc(notaRef, {
            titulo: titulo,
            contenido: contenido,
            fechaActualizacion: new Date(), // Timestamp
            fechaModificacion: new Date() // Update modification date
        });
        console.log(`Nota con ID ${notaId} actualizada.`);
        Swal.fire({
            icon: 'success',
            title: 'Nota actualizada',
            text: 'Tu nota ha sido actualizada exitosamente.',
            customClass: {
                popup: 'swal-popup',
                title: 'swal-title',
                content: 'swal-text',
                confirmButton: 'swal-btn'
            }
        });
        cargarNotas(); // Actualiza la lista de notas
    } catch (error) {
        console.error("Error al actualizar la nota:", error);
        alert("Hubo un error al actualizar la nota.");
    }
}

const notesPerPage = 3;
let currentPage = 1;
let totalNotes = 0;

// Función para cargar notas y renderizarlas en el DOM con paginación
async function cargarNotas() {
    const listaNotas = document.getElementById("listaNotas");
    listaNotas.innerHTML = ""; // Limpiar la lista de notas

    const notas = await obtenerNotas();
    totalNotes = notas.length;
    const totalPages = Math.ceil(totalNotes / notesPerPage);

    if (totalNotes === 0) {
        listaNotas.innerHTML = `
        <div class="alert alert-info" role="alert">
            No hay notas disponibles.
        </div>`;
        return;
    }

    const start = (currentPage - 1) * notesPerPage;
    const end = start + notesPerPage;
    const notasPagina = notas.slice(start, end);

    notasPagina.forEach((nota) => {
        const notaElemento = document.createElement("div");
        notaElemento.classList.add("nota", "p-3", "mb-2", "bg-light", "rounded");
        notaElemento.innerHTML = `
      <h5>${nota.titulo}</h5>
      <p>${nota.contenido}</p>
      <small class="text-muted">Fecha creada: ${new Date(nota.fechaCreacion.seconds * 1000).toLocaleString()}</small>
      <small class="text-muted">Última modificación: ${nota.fechaModificacion ? new Date(nota.fechaModificacion.seconds * 1000).toLocaleString() : 'N/A'}</small>
      <div class="d-flex justify-content-evenly mt-2">
        <button class="btn btn btn-danger eliminar-btn" data-id="${nota.id}">
          <i class="fas fa-trash"></i> Eliminar
        </button>
        <button class="btn btn btn-warning editar-btn" data-id="${nota.id}" data-titulo="${nota.titulo}" data-contenido="${nota.contenido}">
          <i class="fas fa-edit"></i> Editar
        </button>
      </div>
    `;

        listaNotas.appendChild(notaElemento);
    });

    // Asignar eventos a los botones de eliminar
    document.querySelectorAll(".eliminar-btn").forEach((button) => {
        button.addEventListener("click", async (event) => {
            const notaId = event.target.getAttribute("data-id");
            Swal.fire({
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
            }).then(async (result) => {
                if (result.isConfirmed) {
                    await eliminarNota(notaId);
                }
            });
        });
    });

    // Asignar eventos a los botones de editar
    document.querySelectorAll(".editar-btn").forEach((button) => {
        button.addEventListener("click", (event) => {
            const notaId = event.target.getAttribute("data-id");
            const titulo = event.target.getAttribute("data-titulo");
            const contenido = event.target.getAttribute("data-contenido");
            abrirModalEditarNota(notaId, titulo, contenido);
        });
    });

    // Actualizar la información de paginación
    document.getElementById("pageInfo").textContent = `Página ${currentPage} de ${totalPages}`;
    document.getElementById("prevPage").disabled = currentPage === 1;
    document.getElementById("nextPage").disabled = currentPage === totalPages;
}

// Eventos para los botones de paginación
document.getElementById("prevPage").addEventListener("click", () => {
    if (currentPage > 1) {
        currentPage--;
        cargarNotas();
    }
});

document.getElementById("nextPage").addEventListener("click", () => {
    const totalPages = Math.ceil(totalNotes / notesPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        cargarNotas();
    }
});

// Función para verificar los campos del formulario
function verificarCampos() {
    const titulo = document.getElementById("noteTitle");
    const contenido = document.getElementById("noteContent");
    const submitBtn = document.getElementById("submitNota");
    const updateBtn = document.getElementById("updateNota");

    let isValid = true;

    if (titulo.value.trim().length === 0 || titulo.value.trim().length > 20) {
        titulo.classList.add("is-invalid");
        document.getElementById("tituloError").textContent = "El título debe tener entre 1 y 20 caracteres.";
        isValid = false;
    } else {
        titulo.classList.remove("is-invalid");
        document.getElementById("tituloError").textContent = "";
    }

    if (contenido.value.trim().length === 0 || contenido.value.trim().length > 200) {
        contenido.classList.add("is-invalid");
        document.getElementById("contenidoError").textContent = "El contenido debe tener entre 1 y 200 caracteres.";
        isValid = false;
    } else {
        contenido.classList.remove("is-invalid");
        document.getElementById("contenidoError").textContent = "";
    }

    if (isValid) {
        submitBtn.removeAttribute("disabled");
        updateBtn.removeAttribute("disabled");
    } else {
        submitBtn.setAttribute("disabled", "true");
        updateBtn.setAttribute("disabled", "true");
    }
}

document.getElementById("noteTitle").addEventListener("input", verificarCampos);
document.getElementById("noteContent").addEventListener("input", verificarCampos);

// Evento para agregar una nueva nota
document.getElementById("submitNota").addEventListener("click", async () => {
    const titulo = document.getElementById("noteTitle").value.trim();
    const contenido = document.getElementById("noteContent").value.trim();
    if (titulo.length > 0 && titulo.length <= 20 && contenido.length > 0 && contenido.length <= 200) {
        await guardarNota(titulo, contenido);
        $('#addNoteModal').modal('hide');
    }
});

// Evento para actualizar una nota existente
document.getElementById("updateNota").addEventListener("click", async () => {
    const notaId = document.getElementById("updateNota").getAttribute("data-id");
    const titulo = document.getElementById("noteTitle").value.trim();
    const contenido = document.getElementById("noteContent").value.trim();
    if (titulo.length > 0 && titulo.length <= 20 && contenido.length > 0 && contenido.length <= 200) {
        await actualizarNota(notaId, titulo, contenido);
        $('#addNoteModal').modal('hide');
    }
});

// Función para abrir el modal de agregar nota
function abrirModalAgregarNota() {
    document.getElementById("noteTitle").value = "";
    document.getElementById("noteContent").value = "";
    document.getElementById("submitNota").style.display = "block";
    document.getElementById("updateNota").style.display = "none";
    document.getElementById("submitNota").setAttribute("disabled", "true");
    document.getElementById("noteTitle").classList.remove("is-invalid");
    document.getElementById("noteContent").classList.remove("is-invalid");
    document.getElementById("tituloError").textContent = "";
    document.getElementById("contenidoError").textContent = "";
    $('#addNoteModal').modal('show');
}

// Función para abrir el modal de editar nota
function abrirModalEditarNota(notaId, titulo, contenido) {
    document.getElementById("noteTitle").value = titulo;
    document.getElementById("noteContent").value = contenido;
    document.getElementById("submitNota").style.display = "none";
    document.getElementById("updateNota").style.display = "block";
    document.getElementById("updateNota").setAttribute("data-id", notaId);
    document.getElementById("updateNota").setAttribute("disabled", "true");
    document.getElementById("noteTitle").classList.remove("is-invalid");
    document.getElementById("noteContent").classList.remove("is-invalid");
    document.getElementById("tituloError").textContent = "";
    document.getElementById("contenidoError").textContent = "";
    $('#addNoteModal').modal('show');
}

// Asignar eventos a los botones de agregar y editar
document.querySelector(".btn-primary[data-bs-target='#addNoteModal']").addEventListener("click", abrirModalAgregarNota);

// Cargar notas al inicializar la página
document.addEventListener("DOMContentLoaded", cargarNotas);

$('#addNoteModal').on('shown.bs.modal', function () {
    const isEditing = document.getElementById("updateNota").style.display === "block";
    if (!isEditing) {
        document.getElementById("noteTitle").value = "";
        document.getElementById("noteContent").value = "";
        document.getElementById("submitNota").setAttribute("disabled", "true");
    }
});