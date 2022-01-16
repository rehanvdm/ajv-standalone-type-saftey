const gulp = require('gulp');
const fs = require('fs');
const path  = require('path');
const spawn = require('child_process').spawn;

const tsj = require("ts-json-schema-generator");
const esbuild = require("esbuild");

const Ajv = require("ajv");
const addFormats = require("ajv-formats");
const standaloneCode = require("ajv/dist/standalone");


/**
 * Runs a command, returns the stdout on a successful exit code(0)
 * @param command The executable name
 * @param args The args as a string
 * @param cwd Current Working Directory
 * @param echoOutputs Pipes the command standard streams directly to this process to get the output as it is happening,
 *                    not waiting for the exit code
 * @param prefixOutputs Useful if running multiple commands in parallel
 * @param extraEnv Extra variables to pass as Environment variables
 * @return {Promise<string>}
 */
async function execCommand(command, args, cwd = __dirname, echoOutputs = true, prefixOutputs = "", extraEnv = {})
{
  return new Promise((resolve, reject) =>
  {
    let allData = "";
    let errOutput = "";
    const call = spawn(command, [args], {shell: true, windowsVerbatimArguments: true, cwd: cwd, env: {...process.env, ...extraEnv} });

    call.stdout.on('data', function (data)
    {
      allData += data.toString();
      echoOutputs && process.stdout.write(prefixOutputs + data.toString());
    });
    call.stderr.on('data', function (data)
    {
      errOutput = data.toString();
      echoOutputs && process.stdout.write(prefixOutputs + data.toString());
    });
    call.on('exit', function (code)
    {
      if (code == 0)
        resolve(allData);
      else
        reject({command, args, stdout: allData, stderr: errOutput});
    });
  });
}

function clearDir(destDir)
{
  fs.rmSync(destDir, { recursive: true, force: true });
  fs.mkdirSync(destDir, {recursive: true});
}

function typeScriptToJsonSchema(srcDir, destDir)
{
  const config = {
    path: srcDir+"/**/*.ts",
    type: "*",
  };

  let schemas = [];
  console.time("* TS TO JSONSCHEMA");
  let schemaRaw = tsj.createGenerator(config).createSchema(config.type);
  console.timeEnd("* TS TO JSONSCHEMA");

  /* Remove all `#/definitions/` so that we can use the Type name as the $id and have matching $refs with the other Types */
  let schema = JSON.parse(JSON.stringify(schemaRaw).replace(/#\/definitions\//gm, ""));

  /* Save each Type jsonschema individually, use the Type name as $id */
  for(let [id, definition] of Object.entries(schema.definitions))
  {
    let singleTypeDefinition = {
      "$id": id,
      "$schema": "http://json-schema.org/draft-07/schema#",
      ...definition,
    };
    schemas.push(singleTypeDefinition);
    fs.writeFileSync(path.resolve(destDir+"/"+id+".json"), JSON.stringify(singleTypeDefinition, null, 2));
  }

  return schemas;
}

function compileAjvStandalone(schemas, validationFile)
{
  console.time("* AJV COMPILE");
  const ajv = new Ajv({schemas: schemas, code: {source: true, esm: true}});
  addFormats(ajv);
  let moduleCode = standaloneCode(ajv);
  console.timeEnd("* AJV COMPILE");
  fs.writeFileSync(validationFile, moduleCode);
}

function esBuildCommonToEsm(validationFile)
{
  console.time("* ES BUILD");
  esbuild.buildSync({
    // minify: true,
    bundle: true,
    target: ["node14"],
    keepNames: true,
    platform: 'node',
    format: "esm",
    entryPoints: [validationFile],
    outfile: validationFile,
    allowOverwrite: true
  });
  console.timeEnd("* ES BUILD");
}

async function generateTypings(validationFile, validationFileFolder)
{
  console.time("* TSC DECLARATIONS");
  await execCommand("tsc","-allowJs --declaration --emitDeclarationOnly \""+validationFile+"\" --outDir \""+validationFileFolder+"\"");
  console.timeEnd("* TSC DECLARATIONS");
}


async function buildTypes()
{
  let paths = {
    types: path.resolve(__dirname + "/types"),
    typesJsonSchema: path.resolve(__dirname + "/types/schemas"),
    validationFile: path.resolve(__dirname + "/types/schemas/validations.js"),
  };

  /* Clear the output dir for the AJV validation code, definition and JSON Schema definitions */
  clearDir(paths.typesJsonSchema);

  /* Create the JSON Schema files from the TS Types and save them as individual JSON Schema files */
  let schemas =  typeScriptToJsonSchema(paths.types, paths.typesJsonSchema);

  /* Create the AJV validation code in ESM format from the JSON Schema files */
  compileAjvStandalone(schemas, paths.validationFile);

  /* Bundle the AJV validation code file in ESM format */
  esBuildCommonToEsm(paths.validationFile);

  /* Create TypeScript typings for the generated AJV validation code */
  await generateTypings(paths.validationFile, paths.typesJsonSchema);
}

gulp.task('build_types', async () =>
{
  await buildTypes();
});

gulp.task('watch_types', async () =>
{
  await buildTypes();
  gulp.watch(['types/*.ts'], async function(cb)
  {
    await buildTypes();
    cb();
  });
});


