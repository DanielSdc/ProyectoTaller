import { auth, db, collection, query, where, getDocs } from './firebaseconfig.js';

document.addEventListener('DOMContentLoaded', async () => {
  const ctx = document.getElementById('ingresosChart').getContext('2d');
  const ingresosPorMes = {};

  // Escuchar los cambios en el estado de autenticación
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      try {
        const reportesQuery = query(
          collection(db, "reportes"),
          where("usuarioId", "==", user.uid)
        );
        const inmueblesQuery = query(
          collection(db, "inmuebles"),
          where("usuarioId", "==", user.uid)
        );
        const rentasQuery = query(
          collection(db, "rentas"),
          where("usuarioId", "==", user.uid)
        );

        const [reportesSnapshot, inmueblesSnapshot, rentasSnapshot] = await Promise.all([
          getDocs(reportesQuery),
          getDocs(inmueblesQuery),
          getDocs(rentasQuery)
        ]);

        let totalIncome = 0;
        reportesSnapshot.forEach((doc) => {
          const data = doc.data();
          const fechaPago = new Date(data.fechapago);
          const mes = fechaPago.getMonth();
          const anio = fechaPago.getFullYear();
          const key = `${anio}-${mes}`;

          if (!ingresosPorMes[key]) {
            ingresosPorMes[key] = 0;
          }
          ingresosPorMes[key] += parseFloat(data.pago);
          totalIncome += parseFloat(data.pago);
        });
        
        document.getElementById('totalIncome').textContent = `$${totalIncome.toFixed(2)}`;

        document.getElementById('totalProperties').textContent = inmueblesSnapshot.size;

        document.getElementById('totalRentas').textContent = rentasSnapshot.size;

        // Generar la gráfica de ingresos
        const labels = Object.keys(ingresosPorMes).sort();
        const data = labels.map(label => ingresosPorMes[label]);

        new Chart(ctx, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [{
              label: 'Ingresos por Mes',
              data: data,
              borderColor: 'rgba(75, 192, 192, 1)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              borderWidth: 1
            }]
          },
          options: {
            scales: {
              y: {
                beginAtZero: true
              }
            }
          }
        });

        // Cargar imágenes del carrusel
        const carouselImages = document.getElementById('carouselImages');
        let isFirst = true;
        let imageGroup = [];
        inmueblesSnapshot.forEach((doc) => {
          const data = doc.data();
          if (Array.isArray(data.fotos) && data.fotos.length > 0) {
            data.fotos.forEach((fotoUrl) => {
              imageGroup.push(fotoUrl);
              if (imageGroup.length === 3) {
                const div = document.createElement('div');
                div.classList.add('carousel-item');
                if (isFirst) {
                  div.classList.add('active');
                  isFirst = false;
                }
                div.innerHTML = `
                  <div class="row justify-content-center">
                    ${imageGroup.map(url => `
                      <div class="col-4">
                        <img src="${url}" class="d-block w-100 rounded-4 p-1 img-fluid" alt="Imagen">
                      </div>
                    `).join('')}
                  </div>
                `;
                carouselImages.appendChild(div);
                imageGroup = [];
              }
            });
          }
        });

        // If there are remaining images that didn't form a complete group of 3
        if (imageGroup.length > 0) {
          const div = document.createElement('div');
          div.classList.add('carousel-item');
          if (isFirst) {
            div.classList.add('active');
            isFirst = false;
          }
          div.innerHTML = `
            <div class="row justify-content-center">
              ${imageGroup.map(url => `
                <div class="col-4">
                  <img src="${url}" class="d-block w-100 rounded-4 p-1 img-fluid" alt="Imagen">
                </div>
              `).join('')}
            </div>
          `;
          carouselImages.appendChild(div);
        }

      } catch (error) {
        console.error("Error al cargar reportes:", error);
      }
    } else {
      console.warn("Usuario no autenticado. No se pueden cargar reportes.");
    }
  });
});