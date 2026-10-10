'use strict';
var fs = require('fs'), path = require('path');
var srcDir = path.join(__dirname, 'elements'), outDir = __dirname;
var date = new Date().toISOString();

var header = '/*!\n * LWT General Elements\n * Developer: Lee W Winter\n * Last Generated: ' + date + '\n * Requires lwt-core.js to be loaded first.\n */\n\n';
compileBundle('lwt-gen-', 'lwt-general.js', header);

var header = '/*!\n * LWT Form Elements\n * Developer: Lee W Winter\n * Last Generated: ' + date + '\n * Requires lwt-core.js to be loaded first.\n */\n\n';
compileBundle('lwt-frm-', 'lwt-forms.js', header);

var header = '/*!\n * LWT Dashboard Elements\n * Developer: Lee W Winter\n * Last Generated: ' + date + '\n * Requires lwt-core.js to be loaded first.\n */\n\n';
compileBundle('lwt-dsh-', 'lwt-dashboard.js', header);

function compileBundle(key, filename, header) {
  var files = fs.readdirSync(srcDir).filter(function (f) { return new RegExp('^' + key + '.*\\.js$').test(f); }).sort();
  if (!files.length) {
      console.error('No ' + key + '-*.js files found in ' + srcDir);
  }else{
    var bodyContent = files.map(function (f) {
      var contents = fs.readFileSync(path.join(srcDir, f), 'utf8').replace(/\s+$/, '');
      return '/* ---- ' + f + ' ---- */\n' + contents + '\n';
    }).join('\n');

    fs.writeFileSync(path.join(outDir, filename), header + bodyContent + '\n');
    console.log(filename + ' regenerated from ' + files.length + ' files:');
  }
}