function initListaMaquinas() {
  const cont = document.getElementById("lista-maquinas");
  cont.innerHTML = "";

  MAQUINAS.forEach((m) => {
    const div = document.createElement("div");
    div.className = "maquina-item";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.id = `maq-${m.id}`;
    input.value = m.id;

    const label = document.createElement("label");
    label.htmlFor = input.id;
    label.textContent = `${m.nombre} (${m.tiempoServicioMin} min)`;

    div.appendChild(input);
    div.appendChild(label);
    cont.appendChild(div);
  });
}

function obtenerSeleccionados() {
  const ids = [];
  MAQUINAS.forEach((m) => {
    const chk = document.getElementById(`maq-${m.id}`);
    if (chk && chk.checked) {
      ids.push(m.id);
    }
  });
  return MAQUINAS.filter((m) => ids.includes(m.id));
}
