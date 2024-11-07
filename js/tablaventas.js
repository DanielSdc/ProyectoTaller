$(document).ready(function () {
  const table = $("#inmueblesTable").DataTable();

  $("#inmuebleForm").on("submit", function (event) {
    event.preventDefault();

    const inmueble = $("#inmueble").val();
    const arrendatario = $("#arrendatario").val();
    const contacto = $("#contacto").val();
    const fechacobro = $("#fechacobro").val();
    const pago = $("#pago").val();
    const fincontrato = $("#fincontrato").val();

    table.row
      .add([
        inmueble,
        arrendatario,
        contacto,
        fechacobro,
        `$${pago}`,
        fincontrato,
        `<button class="btn btn-sm btn-warning"><i class="fas fa-edit"></i> Editar</button>
             <button class="btn btn-sm btn-danger"><i class="fas fa-trash"></i> Eliminar</button utton>`,
      ])
      .draw(false);

    $("#inmuebleForm")[0].reset();
    $("#addInmuebleModal").modal("hide");
  });
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
