import {
  Rule,
  SchematicContext,
  Tree,
} from "@angular-devkit/schematics";
import { NodePackageInstallTask } from "@angular-devkit/schematics/tasks";

const PACKAGE_JSON = "package.json";

export function hostRead(host: Tree, filePath: string) {
    const buffer = host.read(filePath);
    if (!buffer) {
        throw new Error(`Could not read file ${filePath}`);
    }
    return buffer.toString("utf-8");
}

export function removePackageFromPackageJson(type: string, pkg: string): Rule {
  return (host: Tree, _: SchematicContext) => {
    if (!host.exists(PACKAGE_JSON)) {
      return host;
    }

    const sourceText = hostRead(host, PACKAGE_JSON);
    const packageJson = JSON.parse(sourceText);

    if (!packageJson[type]) {
      return host;
    }

    delete packageJson[type][pkg];

    host.overwrite(PACKAGE_JSON, JSON.stringify(packageJson, null, 2));

    return host;
  };
}

export function addPackageToPackageJson(
  type: string,
  pkg: string,
  version?: string
): Rule {
  return (host: Tree, _: SchematicContext) => {
    if (!host.exists(PACKAGE_JSON)) {
      return host;
    }

    const sourceText = hostRead(host, PACKAGE_JSON);
    const packageJson = JSON.parse(sourceText);

    if (!packageJson[type]) {
      packageJson[type] = {};
    }

    if (!packageJson[type][pkg]) {
      packageJson[type][pkg] = version;
    }

    if (version && !packageJson[type][pkg][version]) {
      packageJson[type][pkg] = version;
    }

    host.overwrite(PACKAGE_JSON, JSON.stringify(packageJson, null, 2));

    return host;
  };
}


export function editTsConfigSpecJson(path: string): Rule {
  return (host: Tree, _: SchematicContext) => {
    if (!host.exists(`${path}/tsconfig.spec.json`)) {
      return host;
    }

    const sourceText = hostRead(host, PACKAGE_JSON);
    const tsconfigJson = JSON.parse(sourceText);

    if (tsconfigJson["files"]) {
      delete tsconfigJson["files"];
    }

    if (!tsconfigJson["compilerOptions"]["types"]) {
      tsconfigJson["compilerOptions"]["types"] = [];
    }

    tsconfigJson["compilerOptions"]["types"] = ["jest", "node"];

    if (!tsconfigJson["compilerOptions"]["module"]) {
      tsconfigJson["compilerOptions"]["module"] = "";
    }

    tsconfigJson["compilerOptions"]["module"] = "commonjs";

    host.overwrite(
      `${path}/tsconfig.spec.json`,
      JSON.stringify(tsconfigJson, null, 2)
    );

    return host;
  };
}

export function deleteFile(file: string) {
  return (host: Tree, _: SchematicContext) => {
    host.delete(file);

    return host;
  };
}

export function runNpmPackageInstall() {
  return (host: Tree, context: SchematicContext) => {
    context.addTask(new NodePackageInstallTask());
    return host;
  };
}
