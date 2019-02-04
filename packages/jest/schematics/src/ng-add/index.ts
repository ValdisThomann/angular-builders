import {
  Rule,
  chain,
  Tree,
  SchematicContext
} from "@angular-devkit/schematics";

import {
  addPackageJsonDependency,
  NodeDependencyType
} from "@schematics/angular/utility/dependencies";

export const ANGULAR_JSON = "angular.json";
export const TSCONFIG = "./tsconfig.json";

import {
  deleteFile,
  removePackageFromPackageJson,
  editTsConfigSpecJson,
  runNpmPackageInstall,
  hostRead
} from "../utils";

export function addJest(): Rule {
  return chain([
    removePackageFromPackageJson("devDependencies", "karma"),
    removePackageFromPackageJson("devDependencies", "karma-chrome-launcher"),
    removePackageFromPackageJson(
      "devDependencies",
      "karma-coverage-istanbul-reporter"
    ),
    removePackageFromPackageJson("devDependencies", "karma-jasmine"),
    removePackageFromPackageJson(
      "devDependencies",
      "karma-jasmine-html-reporter"
    ),
    deleteFile("src/karma.conf.js"),
    deleteFile("src/test.ts"),
    (host: Tree) => {
      addPackageJsonDependency(host, {
        type: NodeDependencyType.Dev,
        name: "@angular-builders/jest",
        version: "0.0.0-PLACEHOLDER"
      });
      addPackageJsonDependency(host, {
        type: NodeDependencyType.Dev,
        name: "jest",
        version: "0.0.0-PLACEHOLDER"
      });
    },
    runNpmPackageInstall(),
    editTsConfigSpecJson("src"),
    editTsConfigRootJson(),
    switchToJestBuilderInAngularJson()
  ]);
}

function switchToJestBuilderInAngularJson(): Rule {
  return (host: Tree, _: SchematicContext) => {
    if (!host.exists(ANGULAR_JSON)) {
      return host;
    }

    const sourceText = hostRead(host, ANGULAR_JSON);
    const angularJson = JSON.parse(sourceText);
    const defaultProject = angularJson["defaultProject"];

    if (
      angularJson["projects"][defaultProject]["architect"]["test"]["builder"]
    ) {
      angularJson["projects"][defaultProject]["architect"]["test"]["builder"] =
        "@angular-builders/jest:run";
    }

    if (
      angularJson["projects"][defaultProject]["architect"]["test"]["options"]
    ) {
      angularJson["projects"][defaultProject]["architect"]["test"][
        "options"
      ] = {};
    }

    host.overwrite(ANGULAR_JSON, JSON.stringify(angularJson, null, 2));

    return host;
  };
}

function editTsConfigRootJson(): Rule {
  return (host: Tree, _: SchematicContext) => {
    if (!host.exists(TSCONFIG)) {
      return host;
    }

    const sourceText = hostRead(host, TSCONFIG);
    const tsconfigJson = JSON.parse(sourceText);

    if (!tsconfigJson["exclude"]) {
      tsconfigJson["exclude"] = [];
    }

    tsconfigJson["exclude"] = ["**/*.spec.ts", "setup-jest.ts"];

    host.overwrite(TSCONFIG, JSON.stringify(tsconfigJson, null, 2));

    return host;
  };
}
