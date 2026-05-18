window.addEventListener("DOMContentLoaded", () => {
  initMap();
  initListaMaquinas();
  document.getElementById("btn-ruta").addEventListener("click", calcularRuta);
});
