/**
 * Puente entre app.js (motor de ruta) y la UI React.
 * Prioridad: la ruta en mapa; este módulo solo sincroniza estado visual.
 */

let api = null;

export function registerPlanificadorUi(handlers) {
  api = handlers;
}

export function unregisterPlanificadorUi() {
  api = null;
}

export function isPlanificadorUiActive() {
  return api != null;
}

export function uiSetResumenHtml(html) {
  if (api?.setResumenHtml) {
    api.setResumenHtml(html);
    return;
  }
  const el = document.getElementById("resumen");
  if (el) el.innerHTML = html;
}

export function uiGetDepartAtInput() {
  if (api?.getDepartAt) return api.getDepartAt() ?? "";
  return document.getElementById("selector-fecha-futura")?.value ?? "";
}

export function uiSetDepartAtInput(value) {
  if (api?.setDepartAt) {
    api.setDepartAt(value ?? "");
    return;
  }
  const input = document.getElementById("selector-fecha-futura");
  if (input) input.value = value ?? "";
}

export function uiGetSelectOrigen() {
  if (api?.getSelectOrigen) return api.getSelectOrigen();
  return document.getElementById("select-origen")?.value ?? "gps";
}

export function uiSetSelectOrigen(value) {
  if (api?.setSelectOrigen) {
    api.setSelectOrigen(value);
    return;
  }
  const select = document.getElementById("select-origen");
  if (select) select.value = value;
}

export function uiGetInputZona() {
  if (api?.getInputZona) return api.getInputZona();
  return document.getElementById("input-zona")?.value ?? "";
}

export function uiSetInputZona(value) {
  if (api?.setInputZona) {
    api.setInputZona(value);
    return;
  }
  const input = document.getElementById("input-zona");
  if (input) input.value = value;
}

export function uiSetGeoEstado(className, text) {
  if (api?.setGeoEstado) {
    api.setGeoEstado({ className, text });
    return;
  }
  const geo = document.getElementById("geo-estado");
  if (!geo) return;
  geo.className = className;
  geo.textContent = text;
}

export function uiSetOrigenInfoHtml(html) {
  if (api?.setOrigenInfoHtml) {
    api.setOrigenInfoHtml(html);
    return;
  }
  const info = document.getElementById("origen-info");
  if (info) info.innerHTML = html;
}

export function uiSetFiltroActivo(text) {
  if (api?.setFiltroActivo) {
    api.setFiltroActivo(text);
    return;
  }
  const el = document.getElementById("filtro-activo");
  if (el) el.textContent = text;
}

export function uiGetSelectedMaquinaIds() {
  if (api?.getSelectedMaquinaIds) return api.getSelectedMaquinaIds();
  const ids = [];
  document.querySelectorAll("#lista-maquinas input[type=checkbox]:checked").forEach((chk) => {
    ids.push(Number(chk.value));
  });
  return ids;
}

export function uiSetMaquinaChecked(id, checked) {
  if (api?.setMaquinaChecked) {
    api.setMaquinaChecked(id, checked);
    return;
  }
  const chk = document.getElementById(`maq-${id}`);
  if (chk) chk.checked = checked;
}

export function uiSetListaMaquinas(maquinas, idsSeleccionados) {
  if (api?.setListaMaquinas) {
    api.setListaMaquinas({ maquinas, idsSeleccionados });
    return false;
  }
  return true;
}

export function uiSetPanelTrafico(payload) {
  if (api?.setPanelTrafico) {
    api.setPanelTrafico(payload);
    return;
  }
  const panel = document.getElementById("panel-trafico-ruta");
  const el =
    document.getElementById("contador-trafico-personalizado") ||
    document.getElementById("trafico-ruta-texto");
  if (!el) return;
  if (payload.hidden) {
    if (panel) panel.hidden = true;
    return;
  }
  if (panel) panel.hidden = false;
  el.innerHTML = payload.html ?? el.textContent;
}

export function uiResetPanelTraficoMensaje(texto) {
  uiSetPanelTrafico({
    hidden: false,
    html: texto ?? ""
  });
}
