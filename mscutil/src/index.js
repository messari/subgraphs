const path = require('path')
//const yargs = require('yargs')
const { exec } = require('child_process');
const fs = require ('fs');
const fse = require('fs-extra');
const yaml = require('js-yaml');
const directoryTree = require('directory-tree');
    
var cmds = [
    "price-oracle",
    "abis",
    "common",
    "mappings",
    "ethereum-abis",
    "subgraph-manifest",
    "schema",
    "package-cfg",
];
var appRoot = process.env.PWD;
var modRoot = path.dirname(__dirname);
var refRoot = modRoot+"/_reference_";
var sgRefRoot = path.dirname(path.dirname(__dirname))+'/subgraphs/_reference_';

const run = async argv => {
    var args = process.argv.slice(2);
    var cmd = args.shift();
    switch (cmd) {
      case 'install':
        install(args.shift());
        break;
      case 'remove':
        remove(args.shift());	
        break;
      case 'install-all':
        cmds.forEach(element => {
          install(element)
        })
        break;
      case 'remove-all':
        cmds.forEach(element => {
          remove(element)
        })
        break;
      case 'update':
        // Everything
        cmds.forEach(element => {
          remove(element);
          install(element)
        })
        break;
      case 'debug':
        console.log('appRoot: '+appRoot)
        console.log('modRoot: '+modRoot)
        console.log('refRoot: '+refRoot)
        console.log('sgRefRoot: '+sgRefRoot)
        break;
      default:
        dispUsage();
        break;
    }
}

function dispUsage() {
        console.error("Usage: mscutil [install | remove] ["+cmds.join(" | ")+"]\n       mscutil [install-all | remove-all]")
}

function symlink(src,dest) {
  var res = fs.symlink(src, dest, function (err) {
    if(err) {
      console.error(err);
      return false;
    } else {
      console.log("Linking "+src+" "+dest)
      return true;
    }
  });
  return res;
}

function installDefaultManifest() {
  fse.copySync(
    refRoot+"/subgraph.yaml",
    appRoot+"/subgraph.yaml",
  )
}

function installDefaultSchema() {
  fse.copySync(
    sgRefRoot+"/schema.graphql",
    appRoot+"/schema.graphql",
  )
}

function installDefaultPackage() {
  fse.copySync(
    refRoot+"/package.json",
    appRoot+"/package.json",
  )
  // Consider running installation automatically.
}

function install(submod) {    
  switch (submod) {
    case 'subgraph-manifest':
      try {
        fs.readFileSync(appRoot+'/subgraph.yaml')
      } catch (e) {
        installDefaultManifest();
      }
      break;
    case 'price-oracle':
      // ./abis/Prices/ - Create directory if nonexistent
      if (!fse.existsSync(appRoot+"/abis/")) {
        fse.mkdirSync(appRoot+"/abis/");
      }
      symlink(sgRefRoot+"/abis/Prices/",appRoot+"/abis/Prices");
      // ./src/prices/ - Create directory if nonexistent
      if (!fs.existsSync(appRoot+"/src/")) {
        fs.mkdirSync(appRoot+"/src/");
      }
      symlink(sgRefRoot+"/src/prices/",appRoot+"/src/prices");
      // ./subgraph.yaml insertion
      j = JSON.parse(fs.readFileSync(refRoot+'/config/priceOracleABIs.json'))
      abis = j.priceOracleABIs
      jy = yaml.load(abis);

      try {
        y = yaml.load(fs.readFileSync(appRoot+'/subgraph.yaml'))
      } catch (e) {
        y = null;
      }
      if(y) {
        jy.forEach(item => function(){
          y.dataSources.forEach(source => function() {
            sma = source.mapping.abis;
            var match = sma.filter(function(val) { return val.file === item.file});
            if(!match.length) {
              sma.push(item)
            }
          }());
        }())
        var output = yaml.dump(y);
        fs.closeSync(fs.openSync(appRoot+'/subgraph.yaml', "w"));
        fs.writeFileSync(appRoot+'/subgraph.yaml',output,function(err) { console.error(err); });
      } else {
        //Use the default.
        installDefaultManifest();
      }
      break;
    case 'abis':
      // ./abis/*.json
      if (!fs.existsSync(appRoot+"/abis/")) {
        fs.mkdirSync(appRoot+"/abis/");
      }
      var tree = directoryTree(sgRefRoot+'/abis',{extensions:/\.json/});
      tree.children.forEach(file => function() {
        if(file.children) return
        symlink(file.path,appRoot+'/abis/'+file.name);
      }());
      break;
    case 'common':
      if (!fs.existsSync(appRoot+"/src/")) {
        fs.mkdirSync(appRoot+"/src/");
      }
      // ./src/common/
      symlink(sgRefRoot+"/src/common/",appRoot+"/src/common");
      break;
    case 'mappings':
      // ./src/common/mappings
      if (!fs.existsSync(appRoot+"/src/")) {
        fs.mkdirSync(appRoot+"/src/");
      }
      symlink(sgRefRoot+"/src/mappings",appRoot+"/src/mappings");
      break;
    case 'ethereum-abis':
      if (!fse.existsSync(appRoot+"/abis/")) {
        fse.mkdirSync(appRoot+"/abis/");
      }
      symlink(refRoot+"/abis/Ethereum/",appRoot+"/abis/Ethereum");
      break;
    case 'schema':
      try {
        y = yaml.load(fs.readFileSync(appRoot+'/schema.graphql'))
      } catch (e) {
        y = null;
      }
      if(y) {
        // Ostensibly already exists.
      } else {
        //Use the default.
        installDefaultSchema();
      }
      break;
    case 'package-cfg':
      try {
        y = yaml.load(fs.readFileSync(appRoot+'/package.json'))
      } catch (e) {
        y = null;
      }
      if(y) {
        // Ostensibly already exists.
      } else {
        //Use the default.
        installDefaultPackage();
      }
      break;
    default:
      dispUsage();
      break;
  }
}

function remove(submod) {
  // Always ask for a confirmation before proceeding.  Later, check git.
  switch (submod) {
    //Note: Removal is non-recursive, or otherwise uses _reference_ specific paths.
    //Confirmation not needed, but unique pathing strongly recommended.
      case 'price-oracle':
        // ./abis/Prices/
        fse.removeSync(appRoot+"/abis/Prices");
        // ./src/prices/
        fse.removeSync(appRoot+"/src/prices");
        // ./subgraph.yaml insertion
        j = JSON.parse(fs.readFileSync(refRoot+'/config/priceOracleABIs.json'))
        abis = j.priceOracleABIs
        jy = yaml.load(abis);
        
        try {
          y = yaml.load(fs.readFileSync(appRoot+'/subgraph.yaml'))
        } catch (e) {
          y = null;
        }
        if(y) {
          jy.forEach(item => function(){
            y.dataSources.forEach(source => function() {
              sma = source.mapping.abis;
              sma = sma.filter(function(val) { return val.file !== item.file});
              source.mapping.abis = sma;
            }());
          }())
          var output = yaml.dump(y);
          fs.closeSync(fs.openSync(appRoot+'/subgraph.yaml', "w"));
          fs.writeFileSync(appRoot+'/subgraph.yaml',output,function(err) { console.error(err); });
        } else {
          //???
        }
        break;
      case 'abis':
        // ./abis/*.json
        var tree = directoryTree(sgRefRoot+'/abis',{extensions:/\.json/});
        tree.children.forEach(file => function() {
          if(file.children) return;
          fse.unlinkSync(appRoot+'/abis/'+file.name);
        }());
        break;
      case 'common':
        // ./src/common/
        fse.removeSync(appRoot+"/src/common");
        break;
      case 'mappings':
        // ./src/mappings
        fse.removeSync(appRoot+"/src/mappings");
        break;
      case 'ethereum-abis':
        fse.removeSync(appRoot+"/abis/Ethereum");
        break;
      case 'schema':
        fse.removeSync(appRoot+"/schema.graphql");
        break;
      case 'package-cfg':
        fse.removeSync(appRoot+"/package.json");
        break;
      default:
        dispUsage();
        break;
    }
}

module.exports = { run }
