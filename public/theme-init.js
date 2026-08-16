// Anti-flash de tema: carga el tema antes de React para evitar FOUC.
// Debe ejecutarse de forma síncrona en <head> (antes del primer paint).
// Archivo externo (no inline) para permitir CSP sin 'unsafe-inline' en script-src.
(function () {
  try {
    var stored = localStorage.getItem('vademecum-theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = stored || (prefersDark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', theme === 'dark');
  } catch {
    // localStorage puede estar bloqueado (modo privado); fallback a light.
  }
})();
