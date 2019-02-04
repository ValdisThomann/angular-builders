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

import { concatMap, map } from "rxjs/operators";

export const ANGULAR_JSON = "angular.json";
export const TSCONFIG = "./tsconfig.json";

import {
  deleteFile,
  removePackageFromPackageJson,
  editTsConfigSpecJson,
  runNpmPackageInstall,
  hostRead,
  getLatestNodeVersion,
  NodePackage
} from "../utils";
import { of, Observable, concat } from "rxjs";
import { NodePackageInstallTask } from "@angular-devkit/schematics/tasks";

export function addJest(): Rule {
  return chain([
    deleteFile("src/karma.conf.js"),
    deleteFile("src/test.ts"),
    updateDependencies(),
    runNpmPackageInstall(),
    editTsConfigSpecJson("src"),
    editTsConfigRootJson(),
    switchToJestBuilderInAngularJson()
  ]);
}

function updateDependencies(): Rule {
  return (tree: Tree, context: SchematicContext): Observable<Tree> => {
    context.logger.debug("Updating dependencies...");
    context.addTask(new NodePackageInstallTask());

    const removeDependencies = of(
      "karma",
      "karma-jasmine",
      "karma-jasmine-html-reporter",
      "karma-chrome-launcher",
      "karma-coverage-istanbul-reporter"
    ).pipe(
      map((packageName: string) => {
        context.logger.debug(`Removing ${packageName} dependency`);

        removePackageFromPackageJson(NodeDependencyType.Dev, packageName);

        return tree;
      })
    );

    const addDependencies = of("jest", "@angular-builders/jest").pipe(
      concatMap((packageName: string) => getLatestNodeVersion(packageName)),
      map((packageFromRegistry: NodePackage) => {
        const { name, version } = packageFromRegistry;
        context.logger.debug(
          `Adding ${name}:${version} to ${NodeDependencyType.Dev}`
        );

        addPackageJsonDependency(tree, {
          type: NodeDependencyType.Dev,
          name,
          version
        });

        return tree;
      })
    );

    return concat(removeDependencies, addDependencies);
  };
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
