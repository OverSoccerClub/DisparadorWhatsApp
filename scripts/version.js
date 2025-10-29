#!/usr/bin/env node

/**
 * Script de Versionamento Automatizado
 * 
 * Uso:
 *   node scripts/version.js patch    - Incrementa patch (1.2.3 -> 1.2.4)
 *   node scripts/version.js minor    - Incrementa minor (1.2.3 -> 1.3.0)
 *   node scripts/version.js major   - Incrementa major (1.2.3 -> 2.0.0)
 *   node scripts/version.js set 1.5.0 - Define versão específica
 *   node scripts/version.js show     - Mostra versão atual
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const packageJsonPath = path.join(__dirname, '..', 'package.json');
const versionFile = path.join(__dirname, '..', 'VERSION.txt');

function getCurrentVersion() {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  return packageJson.version;
}

function setVersion(newVersion) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  packageJson.version = newVersion;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  
  // Atualizar VERSION.txt se existir
  if (fs.existsSync(versionFile)) {
    fs.writeFileSync(versionFile, newVersion + '\n');
  }
  
  return newVersion;
}

function incrementVersion(version, type) {
  const [major, minor, patch] = version.split('.').map(Number);
  
  switch (type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    default:
      throw new Error(`Tipo inválido: ${type}`);
  }
}

function validateVersion(version) {
  const regex = /^\d+\.\d+\.\d+$/;
  if (!regex.test(version)) {
    throw new Error(`Versão inválida: ${version}. Use o formato X.Y.Z`);
  }
  return version;
}

function createGitTag(version) {
  const tag = `v${version}`;
  try {
    execSync(`git tag -a ${tag} -m "Release ${tag}"`, { stdio: 'inherit' });
    console.log(`✅ Tag criada: ${tag}`);
  } catch (error) {
    console.error(`❌ Erro ao criar tag: ${error.message}`);
    throw error;
  }
}

function commitVersionChange(version) {
  try {
    execSync(`git add package.json VERSION.txt`, { stdio: 'inherit' });
    execSync(`git commit -m "chore: release v${version}"`, { stdio: 'inherit' });
    console.log(`✅ Alterações commitadas`);
  } catch (error) {
    console.error(`❌ Erro ao fazer commit: ${error.message}`);
    throw error;
  }
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  try {
    const currentVersion = getCurrentVersion();
    console.log(`📦 Versão atual: ${currentVersion}\n`);
    
    let newVersion;
    
    switch (command) {
      case 'patch':
        newVersion = incrementVersion(currentVersion, 'patch');
        break;
      case 'minor':
        newVersion = incrementVersion(currentVersion, 'minor');
        break;
      case 'major':
        newVersion = incrementVersion(currentVersion, 'major');
        break;
      case 'set':
        if (!args[1]) {
          throw new Error('Versão não especificada. Use: npm run version:set -- 1.0.0');
        }
        newVersion = validateVersion(args[1]);
        break;
      case 'show':
        console.log(`Versão atual: ${currentVersion}`);
        return;
      default:
        console.log(`
Uso: node scripts/version.js <comando> [opções]

Comandos:
  patch              Incrementa versão patch (1.2.3 -> 1.2.4)
  minor              Incrementa versão minor (1.2.3 -> 1.3.0)
  major              Incrementa versão major (1.2.3 -> 2.0.0)
  set <versão>       Define versão específica (ex: 1.5.0)
  show               Mostra versão atual

Exemplos:
  node scripts/version.js patch
  node scripts/version.js minor
  node scripts/version.js major
  node scripts/version.js set 1.5.0
        `);
        return;
    }
    
    console.log(`🔄 Atualizando versão: ${currentVersion} -> ${newVersion}`);
    setVersion(newVersion);
    console.log(`✅ Versão atualizada no package.json`);
    
    if (command !== 'show') {
      console.log(`\n📝 Criando tag Git...`);
      createGitTag(newVersion);
      
      console.log(`\n💾 Fazendo commit...`);
      commitVersionChange(newVersion);
      
      console.log(`\n✨ Versão ${newVersion} criada com sucesso!`);
      console.log(`\n📤 Para enviar para o GitHub, execute:`);
      console.log(`   git push origin main`);
      console.log(`   git push --tags`);
    }
    
  } catch (error) {
    console.error(`❌ Erro: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { getCurrentVersion, setVersion, incrementVersion };
