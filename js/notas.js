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
        });
        console.log("Nota guardada con ID:", docRef.id);
        alert("Nota guardada exitosamente.");
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
        alert("Nota eliminada exitosamente.");
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
            fechaActualizacion: new Date() // Timestamp
        });
        console.log(`Nota con ID ${notaId} actualizada.`);
        alert("Nota actualizada exitosamente.");
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
      <small class="text-muted">${new Date(nota.fechaCreacion.seconds * 1000).toLocaleString()}</small>
      <button class="btn btn-sm btn-danger mt-2 eliminar-btn" data-id="${nota.id}">Eliminar</button>
      <button class="btn btn-sm btn-warning mt-2 editar-btn" data-id="${nota.id}" data-titulo="${nota.titulo}" data-contenido="${nota.contenido}">Editar</button>
    `;

        listaNotas.appendChild(notaElemento);
    });

    // Asignar eventos a los botones de eliminar
    document.querySelectorAll(".eliminar-btn").forEach((button) => {
        button.addEventListener("click", async (event) => {
            const notaId = event.target.getAttribute("data-id");
            const confirmacion = confirm("¿Estás seguro de que deseas eliminar esta nota?");
            if (confirmacion) {
                await eliminarNota(notaId);
            }
        });
    });

    // Asignar eventos a los botones de editar
    document.querySelectorAll(".editar-btn").forEach((button) => {
        button.addEventListener("click", (event) => {
            const notaId = event.target.getAttribute("data-id");
            const titulo = event.target.getAttribute("data-titulo");
            const contenido = event.target.getAttribute("data-contenido");

            document.getElementById("noteTitle").value = titulo;
            document.getElementById("noteContent").value = contenido;
            document.getElementById("submitNota").style.display = "none";
            document.getElementById("updateNota").style.display = "block";
            document.getElementById("updateNota").setAttribute("data-id", notaId);

            $('#addNoteModal').modal('show');
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

// Función para habilitar o deshabilitar el botón de "Agregar Nota"
document.getElementById("submitNota").setAttribute("disabled", "true");

function verificarNota() {
    const titulo = document.getElementById("noteTitle").value.trim();
    const contenido = document.getElementById("noteContent").value.trim();
    const submitBtn = document.getElementById("submitNota");

    if (titulo.length > 0 && titulo.length <= 20 && contenido.length > 0 && contenido.length <= 200) {
        submitBtn.removeAttribute("disabled"); // Habilitar el botón
    } else {
        submitBtn.setAttribute("disabled", "true"); // Deshabilitar el botón
    }
}

document.getElementById("noteTitle").addEventListener("input", verificarNota);
document.getElementById("noteContent").addEventListener("input", verificarNota);

// Evento para agregar una nueva nota
document.getElementById("submitNota").addEventListener("click", async () => {
    const titulo = document.getElementById("noteTitle").value.trim(); // Get title
    const contenido = document.getElementById("noteContent").value.trim();
    if (titulo.length > 0 && titulo.length <= 20 && contenido.length > 0 && contenido.length <= 200) {
        await guardarNota(titulo, contenido);
        document.getElementById("noteTitle").value = ""; // Clear title field
        document.getElementById("noteContent").value = ""; // Clear content field
        $('#addNoteModal').modal('hide'); // Cerrar el modal de agregar nota
    } else {
        alert("Por favor, asegúrate de que el título no tenga más de 20 caracteres y la nota no tenga más de 200 caracteres.");
    }
});

// Evento para actualizar una nota existente
document.getElementById("updateNota").addEventListener("click", async () => {
    const notaId = document.getElementById("updateNota").getAttribute("data-id");
    const titulo = document.getElementById("noteTitle").value.trim();
    const contenido = document.getElementById("noteContent").value.trim();
    if (titulo.length > 0 && titulo.length <= 20 && contenido.length > 0 && contenido.length <= 200) {
        await actualizarNota(notaId, titulo, contenido);
        document.getElementById("noteTitle").value = "";
        document.getElementById("noteContent").value = "";
        document.getElementById("submitNota").style.display = "block";
        document.getElementById("updateNota").style.display = "none";
        $('#addNoteModal').modal('hide');
    } else {
        alert("Por favor, asegúrate de que el título no tenga más de 20 caracteres y la nota no tenga más de 200 caracteres.");
    }
});

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