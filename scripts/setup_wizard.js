const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURACIÓN VISUAL (COLORES ANSI)
// ============================================================================
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m"
};

const log = (msg, color = colors.reset) => console.log(`${color}${msg}${colors.reset}`);
const logStep = (step, msg) => log(`\n[PASO ${step}] ${msg}`, colors.bright + colors.cyan);
const logSuccess = (msg) => log(`   ✅ ${msg}`, colors.green);
const logError = (msg) => log(`   ❌ ${msg}`, colors.red);
const logInfo = (msg) => log(`   ℹ️ ${msg}`, colors.yellow);

// ============================================================================
// FUNCIONES DE VERIFICACIÓN
// ============================================================================

function checkNode() {
  try {
    const version = execSync('node -v').toString().trim();
    logSuccess(`Node.js detectado: ${version}`);
    return true;
  } catch (e) {
    logError("Node.js no está instalado.");
    logInfo("Descárgalo en: https://nodejs.org/");
    return false;
  }
}

function checkOllama() {
  try {
    const version = execSync('ollama --version').toString().trim();
    logSuccess(`Ollama detectado: ${version}`);
    return true;
  } catch (e) {
    logError("Ollama no está instalado.");
    logInfo("Descárgalo en: https://ollama.com/");
    return false;
  }
}

async function runCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', shell: true });
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Comando falló con código ${code}`));
    });
  });
}

// ============================================================================
// ASISTENTE PRINCIPAL
// ============================================================================

async function main() {
  console.clear();
  log("==================================================", colors.magenta);
  log("   💊 VADEMÉCUM INTELIGENTE - SETUP WIZARD 💊   ", colors.bright + colors.magenta);
  log("==================================================", colors.magenta);
  log("Este asistente preparará tu PC para correr la IA local.");

  // PASO 1: Entorno Base
  logStep(1, "Verificando entorno base...");
  const hasNode = checkNode();
  const hasOllama = checkOllama();

  if (!hasNode) {
    logError("No se puede continuar sin Node.js. Instálalo y vuelve a ejecutar este asistente.");
    process.exit(1);
  }

  // PASO 2: Instalación de Librerías
  logStep(2, "Instalando librerías del Scraper y Procesador...");
  try {
    logInfo("Ejecutando 'npm install'...");
    await runCommand('npm', ['install']);
    logSuccess("Librerías instaladas correctamente.");
  } catch (e) {
    logError("Error al instalar librerías. Asegúrate de estar en la carpeta correcta.");
  }

  // PASO 3: Playwright (Navegador para Scraper)
  logStep(3, "Configurando navegador para Scraper...");
  try {
    logInfo("Instalando Chromium (Playwright)...");
    await runCommand('npx', ['playwright', 'install', 'chromium']);
    logSuccess("Navegador listo.");
  } catch (e) {
    logError("Error al instalar el navegador.");
  }

  // PASO 4: IA Local (Ollama)
  if (hasOllama) {
    logStep(4, "Configurando modelos de IA en Ollama...");
    try {
      logInfo("Descargando modelo Llama 3 (esto puede tardar unos minutos)...");
      await runCommand('ollama', ['pull', 'llama3']);
      logSuccess("Modelo Llama 3 listo.");
    } catch (e) {
      logError("Error al descargar el modelo. Asegúrate de que Ollama esté abierto.");
    }
  }

  // FINAL
  log("\n==================================================", colors.magenta);
  log("   🎉 ¡TODO LISTO PARA EMPEZAR! 🎉   ", colors.bright + colors.green);
  log("==================================================", colors.magenta);
  log("\nAhora puedes usar los siguientes comandos:");
  log("1. Scraper:   npm run scrape", colors.cyan);
  log("2. Procesador: npm run process", colors.cyan);
  log("\nLuego, importa el archivo 'knop_processed_data.json' en la App Web.");
  
  log("\nPresiona cualquier tecla para salir...");
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.on('data', process.exit);
}

main();
