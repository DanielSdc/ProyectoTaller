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
  orderBy 
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
async function guardarNota(contenido) {
  const usuario = await obtenerUsuarioActual();

  if (!usuario) {
    console.error("No hay un usuario autenticado.");
    alert("Debes iniciar sesión para guardar notas.");
    return;
  }
  try {
    const docRef = await addDoc(collection(db, "notas"), {
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

// Función para cargar notas y renderizarlas en el DOM
async function cargarNotas() {
  const listaNotas = document.getElementById("listaNotas");
  listaNotas.innerHTML = ""; // Limpiar la lista de notas

  const notas = await obtenerNotas();
  if (notas.length === 0) {
    listaNotas.innerHTML = "<p>No hay notas disponibles.</p>";
    return;
  }

  notas.forEach((nota) => {
    const notaElemento = document.createElement("div");
    notaElemento.classList.add("nota", "p-3", "mb-2", "bg-light", "rounded");
    notaElemento.innerHTML = `
      <h5>${nota.titulo}</h5>
      <p>${nota.contenido}</p>
      <small class="text-muted">${new Date(nota.fechaCreacion.seconds * 1000).toLocaleString()}</small>
      <button class="btn btn-sm btn-danger mt-2 eliminar-btn" data-id="${nota.id}">Eliminar</button>
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
}

// Función para habilitar o deshabilitar el botón de "Agregar Nota"
function verificarNota() {
  const contenido = document.getElementById("noteContent").value.trim();
  const submitBtn = document.getElementById("submitNota");
  
  if (contenido.length > 0) {
    submitBtn.removeAttribute("disabled"); // Habilitar el botón
  } else {
    submitBtn.setAttribute("disabled", "true"); // Deshabilitar el botón
  }
}

// Añadir un evento para comprobar cuando se escriba en el campo de texto
document.getElementById("noteContent").addEventListener("input", verificarNota);

// Evento para agregar una nueva nota
document.getElementById("submitNota").addEventListener("click", async () => {
  const contenido = document.getElementById("noteContent").value;
  const titulo = contenido.slice(0, 20); // Usar los primeros 20 caracteres como título
  if (contenido) {
    await guardarNota(titulo, contenido);
    document.getElementById("noteContent").value = ""; // Limpiar el campo de contenido después de guardar
    $('#addNoteModal').modal('hide'); // Cerrar el modal de agregar nota
  } else {
    alert("Por favor, escribe una nota antes de guardar.");
  }
});

// Cargar notas al inicializar la página
document.addEventListener("DOMContentLoaded", cargarNotas);