import * as vscode from 'vscode';
import fs from 'fs';
import path from 'path';

const LATEST_DOCS_VERSION = '2';

/** Returns the documentation version string used in the URLs. */
function getVersionParam() {
  const configuredVersion = vscode.workspace
    .getConfiguration('remix-docs')
    .get('version');
  return configuredVersion === 'latest' ? 'main' : configuredVersion;
}

/** Shows an info modal if the configured documentation version does not contain the entry. */
function handleUnsupported(entryTitle: string) {
  let configuredVersion = vscode.workspace
    .getConfiguration('remix-docs')
    .get('version') as string;
  configuredVersion =
    configuredVersion === 'latest' ? LATEST_DOCS_VERSION : configuredVersion;

  let unsupported =
    (configuredVersion === '1' && entryTitle.includes('(v2+ docs)')) ||
    (configuredVersion === '2' && entryTitle.includes('(v1 docs)'));

  if (unsupported) {
    vscode.window.showInformationMessage(
      `Not available in Remix ${configuredVersion} docs`,
      {
        detail:
          'You can change the documentation version in the Remix Docs extension configuration.',
        modal: true,
      }
    );
    return true;
  }
  return false;
}

/** Expected commands structure in package.json  */
interface PackageJsonWithCommands {
  contributes: {
    commands: Array<{
      command: string;
      category: string;
      title: string;
      shortTitle: string;
    }>;
  };
}

export function activate(context: vscode.ExtensionContext) {
  const packageJson: PackageJsonWithCommands = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')
  );
  const commands = packageJson.contributes.commands;

  commands.forEach((c) => {
    let registeredCommand = vscode.commands.registerCommand(c.command, () => {
      handleUnsupported(c.title) ||
        vscode.commands.executeCommand(
          'simpleBrowser.show',
          vscode.Uri.parse(
            `https://remix.run/docs/en/${getVersionParam()}/${c.shortTitle}`
          )
        );
    });
    context.subscriptions.push(registeredCommand);
  });
}

export function deactivate() {}
