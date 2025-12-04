/**
 * 📅 Convierte un día local (Argentina, UTC-3) en rango UTC correcto.
 * Ejemplo:
 * Si en Buenos Aires es 2025-11-05 18:45,
 * devuelve:
 * start = 2025-11-05T03:00:00.000Z
 * end   = 2025-11-06T02:59:59.999Z
 */

export const getLocalDayRangeUTC = (localDate = new Date()) => {
  // 🔹 Clonamos para no mutar el parámetro
  const d = new Date(localDate);

  // 🔹 Obtenemos la diferencia horaria local (en minutos)
  const offsetMinutes = d.getTimezoneOffset(); // En Argentina: +180 (es decir, UTC-3)

  // 🔹 Construimos el inicio del día local (00:00) en UTC
  const start = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  start.setMinutes(start.getMinutes() + offsetMinutes);

  // 🔹 Fin del día local → 23:59:59.999
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  end.setMilliseconds(end.getMilliseconds() - 1);

  // console.log(
  //   "🕓 [getLocalDayRangeUTC] start:",
  //   start.toISOString(),
  //   "→ end:",
  //   end.toISOString()
  // );

  return { start, end };
};

/**
 * Devuelve la medianoche local (inicio de día) en UTC.
 */
export const getLocalMidnightUTC = () => {
  const { start } = getLocalDayRangeUTC(new Date());
  return start;
};
