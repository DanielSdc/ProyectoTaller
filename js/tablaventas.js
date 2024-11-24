import { auth, db, collection, addDoc, query, where, getDocs, onAuthStateChanged, deleteDoc, doc, updateDoc, getDoc } from './firebaseconfig.js';

let table;
let reportesTable;

$(document).ready(function () {
  table = $("#inmueblesTable").DataTable({
    language: {
        url: "//cdn.datatables.net/plug-ins/1.11.5/i18n/es-ES.json"
    }
});
  reportesTable = $("#reportesTable").DataTable({
    language: {
        url: "//cdn.datatables.net/plug-ins/1.11.5/i18n/es-ES.json"
    }
});

  // Cargar inmuebles del usuario
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const q = query(
        collection(db, "rentas"),
        where("usuarioId", "==", user.uid)
      );

      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        table.row.add([
          data.inmueble,
          data.arrendatario,
          data.contacto,
          data.fechacobro,
          `$${data.pago}`,
          data.pagado, // Nuevo campo
          data.fincontrato,
          `<button class="btn btn-sm btn-warning btn-edit" data-id="${doc.id}"><i class="fas fa-edit"></i> Editar</button>
           <button class="btn btn-sm btn-danger btn-delete" data-id="${doc.id}"><i class="fas fa-trash"></i> Eliminar</button>`,
        ]).draw(false);
      });

      // Cargar reportes del usuario
      const reportesQuery = query(
        collection(db, "reportes"),
        where("usuarioId", "==", user.uid)
      );

      const reportesSnapshot = await getDocs(reportesQuery);
      reportesSnapshot.forEach((doc) => {
        const data = doc.data();
        reportesTable.row.add([
          data.inmueble,
          data.arrendatario,
          `$${data.pago}`,
          data.fechapago
        ]).draw(false);
      });

      // Agregar eventos a los botones de eliminar y editar
      $("#inmueblesTable tbody").on("click", ".btn-delete", async function () {
        const id = $(this).data("id");
        await eliminarRenta(id);
        table.row($(this).parents('tr')).remove().draw();
      });

      $("#inmueblesTable tbody").on("click", ".btn-edit", async function () {
        const id = $(this).data("id");
        const renta = await obtenerRenta(id);
        abrirModalEditar(renta);
      });
    }
  });

  $("#inmuebleForm").on("submit", async function (event) {
    event.preventDefault();

    const inmueble = $("#inmueble").val();
    const arrendatario = $("#arrendatario").val();
    const contacto = $("#contacto").val();
    const fechacobro = $("#fechacobro").val();
    const pago = $("#pago").val();
    const pagado = $("#pagado").val(); // Nuevo campo
    const fincontrato = $("#fincontrato").val();

    const user = auth.currentUser;
    if (user) {
      try {
        const docRef = await addDoc(collection(db, "rentas"), {
          usuarioId: user.uid,
          inmueble,
          arrendatario,
          contacto,
          fechacobro,
          pago,
          pagado, // Nuevo campo
          fincontrato,
          fechaCreacion: new Date()
        });

        table.row.add([
          inmueble,
          arrendatario,
          contacto,
          fechacobro,
          `$${pago}`,
          pagado, // Nuevo campo
          fincontrato,
          `<button class="btn btn-sm btn-warning btn-edit" data-id="${docRef.id}"><i class="fas fa-edit"></i> Editar</button>
           <button class="btn btn-sm btn-danger btn-delete" data-id="${docRef.id}"><i class="fas fa-trash"></i> Eliminar</button>`,
        ]).draw(false);

        $("#inmuebleForm")[0].reset();
        $("#addInmuebleModal").modal("hide");
      } catch (error) {
        console.error("Error al agregar renta:", error);
        alert("Hubo un error al agregar la renta.");
      }
    } else {
      alert("Debes iniciar sesión para agregar rentas.");
    }
  });

  $("#editInmuebleForm").on("submit", async function (event) {
    event.preventDefault();

    const id = $("#editInmuebleId").val();
    const inmueble = $("#editInmueble").val();
    const arrendatario = $("#editArrendatario").val();
    const contacto = $("#editContacto").val();
    const fechacobro = $("#editFechacobro").val();
    const pago = $("#editPago").val();
    const pagado = $("#editPagado").val(); // Nuevo campo
    const fincontrato = $("#editFincontrato").val();

    try {
      const docRef = doc(db, "rentas", id);
      await updateDoc(docRef, {
        inmueble,
        arrendatario,
        contacto,
        fechacobro,
        pago,
        pagado, // Nuevo campo
        fincontrato
      });

      // Actualizar la fila en la tabla
      const row = $(`#inmueblesTable button[data-id='${id}']`).parents('tr');
      table.row(row).data([
        inmueble,
        arrendatario,
        contacto,
        fechacobro,
        `$${pago}`,
        pagado, // Nuevo campo
        fincontrato,
        `<button class="btn btn-sm btn-warning btn-edit" data-id="${id}"><i class="fas fa-edit"></i> Editar</button>
         <button class="btn btn-sm btn-danger btn-delete" data-id="${id}"><i class="fas fa-trash"></i> Eliminar</button>`
      ]).draw(false);

      // Si el campo "Pagado" es "SI", actualizar la fecha de cobro y agregar a reportes
      if (pagado === "SI") {
        const newFechaCobro = new Date(fechacobro);
        newFechaCobro.setMonth(newFechaCobro.getMonth() + 1);
        await updateDoc(docRef, {
          fechacobro: newFechaCobro.toISOString().split('T')[0],
          pagado: "NO"
        });

        await addDoc(collection(db, "reportes"), {
          usuarioId: auth.currentUser.uid,
          inmueble,
          arrendatario,
          pago,
          fechapago: fechacobro
        });

        reportesTable.row.add([
          inmueble,
          arrendatario,
          `$${pago}`,
          fechacobro
        ]).draw(false);
      }

      $("#editInmuebleModal").modal("hide");
      location.reload(); // Recargar la página para reflejar los cambios
    } catch (error) {
      console.error("Error al actualizar la renta:", error);
      alert("Hubo un error al actualizar la renta.");
    }
  });
});

// Función para eliminar una renta
async function eliminarRenta(id) {
  try {
    await deleteDoc(doc(db, "rentas", id));
    console.log(`Renta con ID ${id} eliminada.`);
    alert("Renta eliminada exitosamente.");
  } catch (error) {
    console.error("Error al eliminar la renta:", error);
    alert("Hubo un error al eliminar la renta.");
  }
}

// Función para obtener una renta
async function obtenerRenta(id) {
  try {
    const docRef = doc(db, "rentas", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      console.log("No such document!");
    }
  } catch (error) {
    console.error("Error al obtener la renta:", error);
  }
}

// Función para abrir el modal de edición
async function abrirModalEditar(renta) {
  $("#editInmuebleModal").modal("show");
  $("#editInmuebleId").val(renta.id);

  // Limpiar las opciones anteriores
  const editInmuebleSelect = $("#editInmueble");
  editInmuebleSelect.empty();

  // Cargar las opciones de inmuebles
  const user = auth.currentUser;
  if (user) {
    try {
      const q = query(
        collection(db, "inmuebles"),
        where("usuarioId", "==", user.uid)
      );
      const querySnapshot = await getDocs(q);

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const option = document.createElement('option');
        option.value = data.nombre; // Usar el ID del inmueble
        option.textContent = data.nombre; // Mostrar el nombre del inmueble
        if (data.nombre === renta.inmueble) {
          option.selected = true; // Seleccionar el inmueble actual
        }
        editInmuebleSelect.append(option);
      });
    } catch (error) {
      console.error("Error al cargar inmuebles:", error);
    }
  }

  $("#editArrendatario").val(renta.arrendatario);
  $("#editContacto").val(renta.contacto);
  $("#editFechacobro").val(renta.fechacobro);
  $("#editPago").val(renta.pago);
  $("#editPagado").val(renta.pagado); // Nuevo campo
  $("#editFincontrato").val(renta.fincontrato);
};

document.addEventListener('DOMContentLoaded', async () => {
  const inmuebleSelect = document.getElementById('inmueble');

  // Escuchar los cambios en el estado de autenticación
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      try {
        const q = query(
          collection(db, "inmuebles"),
          where("usuarioId", "==", user.uid)
        );
        const querySnapshot = await getDocs(q);

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const option = document.createElement('option');
          option.value = data.nombre; // Usar el ID del inmueble
          option.textContent = data.nombre; // Mostrar el nombre del inmueble
          inmuebleSelect.appendChild(option);
        });
      } catch (error) {
        console.error("Error al cargar inmuebles:", error);
      }
    } else {
      console.warn("Usuario no autenticado. No se pueden cargar inmuebles.");
    }
  });
});