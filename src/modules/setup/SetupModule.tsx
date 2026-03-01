import React, { useState } from 'react';
import { Terminal, Download, Cpu, CheckCircle2, Copy, Check, ExternalLink, Play, Package, Monitor } from 'lucide-react';

export const SetupModule: React.FC = () => {
  const [isCopied, setIsCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(id);
    setTimeout(() => setIsCopied(null), 2000);
  };

  const setupScript = `// Ejecuta este comando en tu terminal dentro de la carpeta del proyecto:
node setup_wizard.js`;

  const handleDownloadWizard = () => {
    // Aquí simulamos la descarga del contenido que creamos en /scripts/setup_wizard.js
    const content = `const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURACIÓN VISUAL (COLORES ANSI)
// ============================================================================
const colors = {
  reset: "\\x1b[0m",
  bright: "\\x1b[1m",
  green: "\\x1b[32m",
  yellow: "\\x1b[33m",
  red: "\\x1b[31m",
  cyan: "\\x1b[36m",
  magenta: "\\x1b[35m"
};

const log = (msg, color = colors.reset) => console.log(\`\${color}\${msg}\${colors.reset}\`);
const logStep = (step, msg) => log(\`\\n[PASO \${step}] \${msg}\`, colors.bright + colors.cyan);
const logSuccess = (msg) => log(\`   ✅ \${msg}\`, colors.green);
const logError = (msg) => log(\`   ❌ \${msg}\`, colors.red);
const logInfo = (msg) => log(\`   ℹ️ \${msg}\`, colors.yellow);

function checkNode() {
  try {
    const version = execSync('node -v').toString().trim();
    logSuccess(\`Node.js detectado: \${version}\`);
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
    logSuccess(\`Ollama detectado: \${version}\`);
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
      else reject(new Error(\`Comando falló con código \${code}\`));
    });
  });
}

async function main() {
  console.clear();
  log("==================================================", colors.magenta);
  log("   💊 VADEMÉCUM INTELIGENTE - SETUP WIZARD 💊   ", colors.bright + colors.magenta);
  log("==================================================", colors.magenta);
  log("Este asistente preparará tu PC para correr la IA local.");

  logStep(1, "Verificando entorno base...");
  const hasNode = checkNode();
  const hasOllama = checkOllama();

  if (!hasNode) {
    logError("No se puede continuar sin Node.js. Instálalo y vuelve a ejecutar este asistente.");
    process.exit(1);
  }

  logStep(2, "Instalando librerías del Scraper y Procesador...");
  try {
    logInfo("Ejecutando 'npm install'...");
    await runCommand('npm', ['install']);
    logSuccess("Librerías instaladas correctamente.");
  } catch (e) {
    logError("Error al instalar librerías. Asegúrate de estar en la carpeta correcta.");
  }

  logStep(3, "Configurando navegador para Scraper...");
  try {
    logInfo("Instalando Chromium (Playwright)...");
    await runCommand('npx', ['playwright', 'install', 'chromium']);
    logSuccess("Navegador listo.");
  } catch (e) {
    logError("Error al instalar el navegador.");
  }

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

  log("\\n==================================================", colors.magenta);
  log("   🎉 ¡TODO LISTO PARA EMPEZAR! 🎉   ", colors.bright + colors.green);
  log("==================================================", colors.magenta);
  log("\\nAhora puedes usar los siguientes comandos:");
  log("1. Scraper:   npm run scrape", colors.cyan);
  log("2. Procesador: npm run process", colors.cyan);
  log("\\nLuego, importa el archivo 'knop_processed_data.json' en la App Web.");
  
  log("\\nPresiona cualquier tecla para salir...");
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.on('data', process.exit);
}

main();`;
    const blob = new Blob([content], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'setup_wizard.js';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-5xl mx-auto pb-20 animate-in fade-in duration-300">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Monitor className="w-6 h-6 text-indigo-400" />
          Instalación del Motor Local (PC)
        </h2>
        <p className="text-slate-400 mt-1">
          Sigue estos pasos para activar la IA potente en tu computadora y alimentar este sistema.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna Izquierda: Pasos */}
        <div className="lg:col-span-2 space-y-6">
          {/* Paso 1: Requisitos */}
          <section className="bg-slate-900 rounded-3xl p-8 border border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5">
              <Package className="w-24 h-24 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 text-sm">1</span>
              Requisitos Previos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a 
                href="https://nodejs.org/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800 hover:border-indigo-500/50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/10 rounded-lg text-green-400">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-200">Node.js</p>
                    <p className="text-xs text-slate-500">Entorno de ejecución</p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-600 group-hover:text-indigo-400" />
              </a>
              <a 
                href="https://ollama.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800 hover:border-indigo-500/50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-200">Ollama</p>
                    <p className="text-xs text-slate-500">Motor de IA Local</p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-600 group-hover:text-indigo-400" />
              </a>
            </div>
          </section>

          {/* Paso 2: El Asistente */}
          <section className="bg-slate-900 rounded-3xl p-8 border border-slate-800">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 text-sm">2</span>
              Ejecutar el Asistente de Configuración
            </h3>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              Hemos creado un script que automatiza toda la instalación de librerías, navegadores y modelos de IA por ti.
            </p>
            
            <div className="bg-slate-950 rounded-2xl border border-slate-800 p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Terminal / CMD</span>
                <div className="flex gap-4">
                  <button 
                    onClick={handleDownloadWizard}
                    className="flex items-center gap-2 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Descargar Script
                  </button>
                  <button 
                    onClick={() => copyToClipboard(setupScript, 'command')}
                    className="flex items-center gap-2 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    {isCopied === 'command' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {isCopied === 'command' ? 'Copiado' : 'Copiar comando'}
                  </button>
                </div>
              </div>
              <code className="block font-mono text-sm text-indigo-300 bg-indigo-500/5 p-4 rounded-xl border border-indigo-500/10">
                node setup_wizard.js
              </code>
            </div>
          </section>

          {/* Paso 3: Flujo de Trabajo */}
          <section className="bg-slate-900 rounded-3xl p-8 border border-slate-800">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 text-sm">3</span>
              Flujo de Trabajo Diario
            </h3>
            <div className="space-y-4">
              <div className="flex gap-4 p-4 bg-slate-800/30 rounded-2xl border border-slate-800/50">
                <div className="p-3 bg-slate-800 rounded-xl text-amber-400 h-fit">
                  <Play className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-200">1. Ejecuta el Scraper</p>
                  <p className="text-xs text-slate-500 mt-1">Usa `npm run scrape` para recolectar datos de farmacias.</p>
                </div>
              </div>
              <div className="flex gap-4 p-4 bg-slate-800/30 rounded-2xl border border-slate-800/50">
                <div className="p-3 bg-slate-800 rounded-xl text-indigo-400 h-fit">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-200">2. Procesa con IA</p>
                  <p className="text-xs text-slate-500 mt-1">Usa `npm run process` para que la IA de tu PC analice los datos.</p>
                </div>
              </div>
              <div className="flex gap-4 p-4 bg-slate-800/30 rounded-2xl border border-slate-800/50">
                <div className="p-3 bg-slate-800 rounded-xl text-emerald-400 h-fit">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-200">3. Importa en la App</p>
                  <p className="text-xs text-slate-500 mt-1">Carga el archivo generado en la pestaña "Configuración" de esta App.</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Columna Derecha: Estado y Ayuda */}
        <div className="space-y-6">
          <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden">
            <div className="absolute -bottom-4 -right-4 opacity-20">
              <Terminal className="w-32 h-32" />
            </div>
            <h3 className="text-xl font-bold mb-4">¿Por qué usar el Motor Local?</h3>
            <ul className="space-y-3 text-sm text-indigo-100">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                <span><strong>Sin límites:</strong> Procesa miles de productos sin pagar APIs.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                <span><strong>Privacidad:</strong> Tus datos nunca salen de tu PC.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                <span><strong>Potencia:</strong> Usa toda la RAM y GPU de tu computadora.</span>
              </li>
            </ul>
          </div>

          <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Consejo Pro</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Si tienes una tarjeta de video NVIDIA, Ollama la usará automáticamente, haciendo que el procesamiento sea hasta 10 veces más rápido.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
