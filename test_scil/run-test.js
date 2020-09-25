#!/usr/bin/env node

const args = require('minimist')(process.argv.slice(2),{string:['input','i']});
const path = require('path');
const fs = require('fs');
const execSync = require('child_process').execSync;

const bundle_dir = path.resolve(__dirname, 'bundle')
const debundle_dir = path.resolve(__dirname, 'debundle')
const debundle_config_dir = path.resolve(__dirname, 'debundle.config')
const tmp_output_dir = path.resolve(__dirname, 'tmp_debundle_result')
const debundle_js_cli = path.resolve(__dirname, "../src/index.js")

// ----------------------------------------------------------------------------
// Set up configuration
// ----------------------------------------------------------------------------

const bundle_file_name = args._[0] || args.input || args.i || null;
const showHelp = args.help || args.h


if (showHelp) {
  console.log(`This is a debundler - it takes a bundle and expands it into the source that was used to compile it.`);
  console.log();
  console.log(`Usage: ${process.argv[1]} [input file] {OPTIONS}`);
  console.log();
  console.log(`Example: `);
  console.log(`  ${process.argv[1]}       # test all bundle files in ${bundle_dir}`);
  console.log(`  ${process.argv[1]} -i "8.1-"     # only test the bundle file whose name starts with "8.1-"`);
  console.log();
  console.log(`Options:`);
  console.log(`   --input, -i  Optional. Full name or prefix part name of bundle file. It must exist in ${bundle_dir}.`);
  console.log(`   --help, -h  `);
  console.log();
  process.exit(1);
}


function get_output_name(bundle_file_name) {
  return bundle_file_name.split('-')[0]
}

function read_first_two_lines(file) {
  try {
    // read contents of the file
    const data = fs.readFileSync(file, 'UTF-8');

    // split the contents by new line
    const lines = data.split(/\r?\n/);

    return lines.slice(0, 2);

  } catch (err) {
    console.error(err);
  }

}

function get_bundle_file_by_name_or_part_name(bundle_file_name) {
  var bundle_file = path.normalize(bundle_dir + '/' + bundle_file_name)

  if (fs.existsSync(bundle_file)) return bundle_file;

  bundle_file_name2 = null;
  fs.readdirSync(bundle_dir).forEach(file => {
    if (file.startsWith(bundle_file_name)) {
      bundle_file_name2 = file;
      return false;
    }
  });

  var bundle_file = path.normalize(bundle_dir + '/' + bundle_file_name2)

  if (fs.existsSync(bundle_file)) return bundle_file;

  console.error(`[BUNDLE FILE] not found: ${bundle_file_name}`)

}

function debundle_a_bundle(bundle_file_name, output_name) {
  var bundle_file = get_bundle_file_by_name_or_part_name(bundle_file_name)

  var first_two_lines = read_first_two_lines(bundle_file)

  var exec = /debundle\.config=(.+)/.exec(first_two_lines[0])
  var config_file_name = exec ? exec[1] : ''
  config_file = path.resolve(debundle_config_dir, config_file_name)
  if (!(fs.existsSync(config_file) && fs.lstatSync(config_file).isFile())) {
    console.error(`[Debundle Error] no config file ${config_file}.Pleae check the first line of ${bundle_file}`);
    return
  } else {
    console.log(`[Debundle config] config file ${config_file}`);
  }

  exec = /bundle_file_name=(.+)/.exec(first_two_lines[1])
  if (exec) {
    var bundle_file_name2 = exec[1]
    bundle_file = get_bundle_file_by_name_or_part_name(bundle_file_name2)
    console.log(`[Debundle] use ${bundle_file} for ${bundle_file_name}`);
  }

  var cmd = `node ${debundle_js_cli}  -i ${bundle_file} -o ${path.normalize(tmp_output_dir + '/' + output_name)} -c ${config_file}`
  console.log(`[Debundle Cmd] ${cmd}`);

  //same as stdio = [process.stdin, process.stdout, process.stderr]
  // http://theantway.com/2016/12/capture-console-output-when-using-child_process-execsync-in-node-js/
  var stdio = 'inherit'
  execSync(cmd, {stdio: stdio});
}

function test_a_bundle(bundle_file_name) {
  var output_name = get_output_name(bundle_file_name)

  debundle_a_bundle(bundle_file_name, output_name)

  diff_dir(`${debundle_dir}/${output_name}`, `${tmp_output_dir}/${output_name}`)
}

function diff_dir(old_dir, new_dir) {

}

function test_all() {
  try {
    const files = fs.readdirSync(bundle_dir);

    files.forEach(file => {
      console.log(`[Test] ${file}`);
      test_a_bundle(file);
    });

  } catch (err) {
    console.log(err);
  }
}

if (bundle_file_name) {
  console.log(`[Debundle] input provide by user is ${bundle_file_name} `)
  test_a_bundle(String(bundle_file_name)); // String is used for id which is of type interger
} else
  test_all();
