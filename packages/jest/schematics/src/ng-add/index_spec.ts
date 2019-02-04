// import { Tree } from "@angular-devkit/schematics";
import {
  SchematicTestRunner,
  UnitTestTree
} from "@angular-devkit/schematics/testing";
import { Schema as WorkspaceOptions } from "@schematics/angular/workspace/schema";
import {
  Schema as ApplicationOptions,
  Style
} from "@schematics/angular/application/schema";
import * as path from "path";

const collectionPath = path.join(__dirname, "../collection.json");

describe("ng-add", () => {
  const runner = new SchematicTestRunner("ng-add", collectionPath);

  const workspaceOptions: WorkspaceOptions = {
    name: "workspace",
    newProjectRoot: "projects",
    version: "latest"
  };

  describe("without project", () => {
    const appOptions: ApplicationOptions = {
      name: "bar",
      projectRoot: "",
      inlineStyle: false,
      inlineTemplate: false,
      routing: false,
      style: Style.Css,
      skipTests: false,
      skipPackageJson: false
    };

    let appTree: UnitTestTree;
    beforeEach(() => {
      appTree = runner.runExternalSchematic(
        "@schematics/angular",
        "workspace",
        workspaceOptions
      );
      appTree = runner.runExternalSchematic(
        "@schematics/angular",
        "application",
        appOptions,
        appTree
      );
    });
    it("works", () => {
      const tree = runner.runSchematic("ng-add", {}, appTree);
      console.log(tree.files);
      expect(tree.files).not.toContain("src/karma.conf.js", "src/test.ts");
    });
  });
});
