"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
function activate(context) {
    let disposable = vscode.commands.registerCommand("extension.generateReadme", () => {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0]; // Get the first workspace folder
        if (!workspaceFolder) {
            vscode.window.showErrorMessage("No workspace folder is open");
            return;
        }
        const directoryPath = workspaceFolder.uri.fsPath; // Get the path to the workspace folder
        // Get a list of all the directories in the project
        const directories = getDirectories(directoryPath);
        // Display a UI panel with checkboxes for each directory
        vscode.window
            .showQuickPick(directories.map((dir) => {
            return { label: dir, picked: true };
        }), {
            canPickMany: true,
            placeHolder: "Select the directories to include in the README.md file",
        })
            .then((selection) => {
            if (!selection) {
                return;
            }
            const markdown = generateMarkdown(directoryPath, selection);
            fs.writeFile(`${directoryPath}/README.md`, markdown, (err) => {
                if (err) {
                    vscode.window.showErrorMessage("Error writing README.md file");
                    return;
                }
                vscode.window.showInformationMessage("README.md file generated!");
            });
        });
    });
    context.subscriptions.push(disposable);
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
// Get a list of all the directories in a directory
const getDirectories = (directoryPath) => {
    const directories = [];
    fs.readdirSync(directoryPath).forEach((file) => {
        const filePath = path.join(directoryPath, file);
        const fileStat = fs.statSync(filePath);
        if (fileStat.isDirectory()) {
            directories.push(file);
        }
    });
    return directories;
};
const showComments = (filePath) => {
    try {
        const fileContent = fs.readFileSync(filePath, "utf-8");
        const comments = fileContent.match(/\/\/ file description:(.*)/);
        if (comments !== null) {
            return comments[1].trim();
        }
        else {
            return "";
        }
    }
    catch (err) {
        console.error(`Error reading file: ${err}`);
    }
};
// Generate the markdown for the selected directories
const generateMarkdown = (directoryPath, selectedDirectories) => {
    let markdown = "# Project Contents\n\n";
    // let showDescription = false;
    // vscode.window
    //     .showInformationMessage(
    //         "This function will search for file descriptions in your project files. Do you want to continue?",
    //         { modal: true },
    //         "Yes",
    //         "No"
    //     )
    //     .then((selectedOption) => {
    //         if (selectedOption === "Yes") {
    //             // Execute the function
    //             showDescription = true;
    //         }
    //     });
    selectedDirectories.forEach((selectedDir) => {
        const dirPath = path.join(directoryPath, selectedDir.label);
        const files = getFilesRecursive(dirPath);
        const subDirs = getDirectories(dirPath);
        const addedFiles = new Set();
        markdown += `## ${selectedDir.label}\n\n`;
        if (files.length > 0) {
            files.forEach((file) => {
                const filePath = path.join(dirPath, file);
                let description = showComments(filePath);
                if (!addedFiles.has(file)) {
                    markdown += `- [${file}](${path
                        .relative(directoryPath, filePath)
                        .replace(/\\/g, "/")})`;
                    if (description !== "") {
                        markdown += `\n  - ${description}`;
                    }
                    markdown += "\n";
                    addedFiles.add(file);
                }
            });
            markdown += "\n";
        }
        subDirs.forEach((subDir) => {
            markdown += `### ${subDir}\n\n`;
            const subDirPath = path.join(dirPath, subDir);
            const subDirFiles = getFilesRecursive(subDirPath);
            if (subDirFiles.length > 0) {
                subDirFiles.forEach((file) => {
                    const filePath = path.join(subDirPath, file);
                    let description = showComments(filePath);
                    if (!addedFiles.has(file)) {
                        markdown += `- [${file}](${path
                            .relative(directoryPath, filePath)
                            .replace(/\\/g, "/")})`;
                        if (description !== "") {
                            markdown += `\n  - ${description}`;
                        }
                        markdown += "\n";
                        addedFiles.add(file);
                    }
                });
                markdown += "\n";
            }
        });
        markdown += "\n";
    });
    return markdown;
};
// Recursively get all files in a directory
const getFilesRecursive = (directoryPath) => {
    const files = [];
    fs.readdirSync(directoryPath).forEach((file) => {
        const filePath = path.join(directoryPath, file);
        const fileStat = fs.statSync(filePath);
        if (!fileStat.isDirectory()) {
            if (!file.startsWith(".") && !file.endsWith(".md")) {
                // Exclude hidden files and markdown files
                files.push(file);
            }
        }
    });
    return files;
};
//# sourceMappingURL=extension.js.map