import fs from 'node:fs';
import { resolve, join } from 'node:path';

import inquirer from 'inquirer';
import {execa} from 'execa';
import ora from 'ora';
import { load } from 'cheerio';

import hardhatNetworks from '../hardhat.network';

// Directory name constants
const CONTRACT_DIR_NAME = 'contracts';
const TEST_DIR_NAME = 'test';
const COVERAGE_DIR_NAME = 'coverage';
const IGNITION_MODULE_DIR_NAME = 'ignition/modules';

// Related directory path constants
const ROOT_PATH = resolve(__dirname, '..');
const CONTRACT_DIR = resolve(ROOT_PATH, CONTRACT_DIR_NAME);
const TEST_DIR = resolve(ROOT_PATH, TEST_DIR_NAME);
const COVERAGE_DIR = resolve(ROOT_PATH, COVERAGE_DIR_NAME);
const IGNITION_MODULE_DIR = resolve(ROOT_PATH, IGNITION_MODULE_DIR_NAME);

/**
 * Interface for question
 * @interface Question
 */
interface Question {
  type: string;
  name: string;
  message: string;
  choices: Array<string>;
}

/**
 * Initialize contract deployment questions
 * @returns {Question} An object parsed as contract deployment questions
 */
function initContractsQuestions(): Question {
  const contracts = fs.readdirSync(CONTRACT_DIR);
  const contractsChoices: Array<string> = [];

  for (const contractFileName of contracts) {
    const contractFile = resolve(CONTRACT_DIR, contractFileName);
    const fileStat = fs.statSync(contractFile);

    if (fileStat.isFile()) {
      const [contractName] = contractFileName.split('.');
      contractsChoices.push(contractName);
    }
  }

  return {
    type: 'list',
    name: 'contract',
    message: 'Please select the contract to deploy:',
    choices: contractsChoices
  };
}

/**
 * Initialize deployment network questions
 *
 * @returns {Promise<Question>} An object parsed as deployment network questions
 */
async function initDeployNetworkQuestions(): Promise<Question> {
  const networkChoices: any = [];

  for (const networkName of Object.keys(hardhatNetworks)) {
    networkChoices.push(networkName);
  }

  return {
    type: 'list',
    name: 'network',
    message: 'Please select the network to deploy the contract to:',
    choices: networkChoices
  };
}

/**
 * Execute a command with a loading indicator
 *
 * @param {string} spinnerText The text content of the loading indicator
 * @param {string} command The command string to be executed
 * @returns {Promise<string>} The result of the executed command
 */
async function loadingExecCommands(spinnerText: string, command: string): Promise<string> {
  const spinner = ora(spinnerText).start();
  spinner.color = 'blue';

  const [cmd, ...args] = command.split(' ');

  try {
    const { all } = await execa(cmd, args, {all: true, shell: true});

    spinner.color = 'green';
    spinner.text = `${spinnerText} success.`;
    spinner.succeed();

    return all;
  } catch (error) {
    console.error('Command failed:', error);
    spinner.text = `${spinnerText} failed.`;
    spinner.fail();
    process.exit(0);
  }
}

/**
 * Detect whether a specified file exists in the specified directory
 *
 * @param {string} dir The directory path
 * @param {string} filename The filename
 * @returns {boolean} Returns true if the specified file exists in the specified directory, otherwise false
 */
function detectFilesInTheSpecifiedDirectory(dir: string, filename: string): boolean {
  const testFiles = fs.readdirSync(dir);

  return testFiles.includes(filename);
}

/**
 * Check if the contract test coverage is 100%
 *
 * @param {string} contract The contract name
 * @returns {Promise<void>}
 */
async function checkTextCovered(contract: string) {
  await loadingExecCommands('Executing test coverage', 'npm run coverage');

  const spinner = ora('Checking if the test coverage is 100%.').start();
  spinner.color = 'blue';

  const contractCoveragePath = resolve(COVERAGE_DIR, CONTRACT_DIR_NAME, `${contract}.sol.html`);

  const contractResult = fs.readFileSync(contractCoveragePath);

  const $ = load(contractResult.toString());

  const parentDom = $('.clearfix');
  const coverages = parentDom.find('.strong');

  let isAllCovered = true;

  coverages.each((_, ele) => {
    const result = $(ele).text();

    if (!result.includes('100%')) {
      isAllCovered = false;
    }
  });

  if (isAllCovered) {
    spinner.text = `The test coverage of ${contract} contract is 100%.`;
    spinner.succeed();
  } else {
    spinner.text = `The test coverage of ${contract} contract is not 100%.`;
    spinner.fail();
    process.exit(0);
  }
}

/**
 * Detect the existence of test files and test coverage
 *
 * @param {string} contract The contract name
 * @returns {Promise<void>}
 */
async function detectTestExistenceAndCoverage(contract: string) {
  const spinner = ora('Detecting the existence of test files').start();
  spinner.color = 'blue';

  const contractTestFileName = `${contract}.test.ts`;

  const isExists = detectFilesInTheSpecifiedDirectory(TEST_DIR, contractTestFileName);

  if (isExists) {
    spinner.text = `The presence of test files was detected`;
    spinner.succeed();

    await checkTextCovered(contract);
  } else {
    spinner.text = `There is no test file for ${contract} contract in the test directory. Please add a test/${contractTestFileName} file.`;
    spinner.fail();
    process.exit(0);
  }
}

/**
 * Deploy the contract to the specified network
 *
 * @param {string} contract The contract name
 * @param {string} network The network name
 * @returns {Promise<void>}
 */
async function deploymentContractToNetwork(contract: string, network: string) {
  const spinner = ora('Detecting the existence of the test file').start();
  spinner.color = 'blue';

  const contractModuleFileName = `${contract}.ts`;

  const isExists = detectFilesInTheSpecifiedDirectory(IGNITION_MODULE_DIR, contractModuleFileName);

  if (isExists) {
    spinner.text = `The presence of deployment files was detected`;
    spinner.succeed();

    const message = await loadingExecCommands(`Contract ${contract} deploys to the ${network} network`, `npx hardhat ignition deploy ./${join(IGNITION_MODULE_DIR_NAME, contractModuleFileName)} --network ${network}`);

    console.log(message);
  } else {
    spinner.text = `The deployment file for the ${contract} contract is not found in the module directory. Please add a ${IGNITION_MODULE_DIR}/${contractModuleFileName} file.`;
    spinner.fail();
    process.exit(0);
  }
}

/**
 * Deploy contract
 *
 * @returns {Promise<void>}
 */
async function deploymentContract() {
  const contractsQuestions = initContractsQuestions();
  const networkQuestions = await initDeployNetworkQuestions();

  const questions = [
    contractsQuestions,
    networkQuestions
  ];

  const config = await inquirer.prompt(questions);

  await loadingExecCommands('Compiling contract files', 'npm run compile');

  await detectTestExistenceAndCoverage(config.contract);

  await deploymentContractToNetwork(config.contract, config.network);
}

// Listen for process exit event
process.on('SIGINT', () => {
  process.exit(0);
});

deploymentContract();