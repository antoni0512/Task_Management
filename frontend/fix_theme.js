const fs = require('fs');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        if (file === 'node_modules') return;
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('e:/Task_Management_git/Task_Management/frontend/src');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');

    // Clean hardcore dark backgrounds (hex overrides)
    content = content.replace(/bg-\[#[0-9a-fA-F]{6}\](\/[0-9]+)?/g, "bg-background");

    // Clean text overrides
    content = content.replace(/text-zinc-[123]00/g, "text-foreground");
    content = content.replace(/text-zinc-[456789]00/g, "text-muted-foreground");
    content = content.replace(/text-white/g, "text-foreground");

    // Clean borders and hover effects tied to black/white
    content = content.replace(/border-white\/\[?[0-9.]+\]?/g, "border-border");
    content = content.replace(/hover:bg-white\/[0-9]+/g, "hover:bg-muted");
    content = content.replace(/bg-white\/\[?[0-9.]+\]?/g, "bg-muted");

    fs.writeFileSync(file, content, 'utf8');
});
console.log("Replaced classes in " + files.length + " files.");
