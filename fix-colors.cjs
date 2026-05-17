const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let original = content;

      // Backgrounds
      content = content.replace(/bg-slate-[89]00(?:\/[0-9]+)?/g, 'bg-card');
      content = content.replace(/bg-slate-[12]00(?:\/[0-9]+)?/g, 'bg-muted');
      content = content.replace(/bg-slate-50(?:\/[0-9]+)?/g, 'bg-background');
      content = content.replace(/bg-brand-surface(?:\/[0-9]+)?/g, 'bg-card');
      content = content.replace(/bg-brand-bg(?:\/[0-9]+)?/g, 'bg-background');
      content = content.replace(/bg-white(?:\/[0-9\.]+)?/g, 'bg-card');
      content = content.replace(/bg-indigo-[123456789]00(?:\/[0-9]+)?/g, 'bg-primary');
      content = content.replace(/bg-brand-primary(?:\/[0-9]+)?/g, 'bg-primary');
      content = content.replace(/bg-\[\#04070d\](?:\/[0-9]+)?/g, 'bg-background');

      // Borders
      content = content.replace(/border-slate-[1278]00(?:\/[0-9]+)?/g, 'border-border');
      content = content.replace(/border-slate-300(?:\/[0-9]+)?/g, 'border-border');
      content = content.replace(/border-white\/[0-9]+/g, 'border-border/50');
      content = content.replace(/border-brand-primary(?:\/[0-9]+)?/g, 'border-primary/50');
      content = content.replace(/border-indigo-[123456789]00(?:\/[0-9]+)?/g, 'border-primary/50');

      // Text colors
      content = content.replace(/text-slate-[3456]00/g, 'text-muted-foreground');
      content = content.replace(/text-slate-[89]00/g, 'text-foreground');
      content = content.replace(/text-slate-[12]00/g, 'text-foreground');
      content = content.replace(/text-white/g, 'text-foreground');
      content = content.replace(/text-brand-[a-z]+/g, 'text-primary');
      content = content.replace(/text-indigo-[123456789]00/g, 'text-primary');

      // Others
      content = content.replace(/ring-indigo-[0-9]+/g, 'ring-primary');
      content = content.replace(/shadow-indigo-[0-9]+\/[0-9]+/g, 'shadow-primary/20');

      if (content !== original) {
        fs.writeFileSync(fullPath, content);
        console.log('Fixed', fullPath);
      }
    }
  }
}

processDir(path.resolve('./src'));
