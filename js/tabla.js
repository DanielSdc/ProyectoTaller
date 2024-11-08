$(document).ready(function () {
  const table = $("#inmueblesTable").DataTable();

  $("#inmuebleForm").on("submit", function (event) {
    event.preventDefault();

    const nombre = $("#nombre").val();
    const ubicacion = $("#ubicacion").val();
    const tamano = $("#tamano").val();
    const cuartos = $("#cuartos").val();
    const banos = $("#banos").val();
    const valor = $("#valor").val();
    const fotos = $("#fotos").val();

    table.row
      .add([
        nombre,
        ubicacion,
        `${tamano} m2`,
        cuartos,
        banos,
        `$${valor}`,
        fotos,
        `<button class="btn btn-sm btn-warning"><i class="fas fa-edit"></i> Editar</button>
             <button class="btn btn-sm btn-danger"><i class="fas fa-trash"></i> Eliminar</button>`,
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
