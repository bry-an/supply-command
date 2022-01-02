#!/usr/bin/env node
import chalk from 'chalk';
import path from 'path';
import {
    ensureArray,
    identity,
    isNumber,
    pipeAsync,
    sum,
} from './src/util.js';
import { checkFile } from './src/fsUtil.js';
import { getSupply, setSupply, createNewDataset  } from './src/supplyCommand.js';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
const argv = yargs(hideBin(process.argv)).argv;

const log = console.log;
const logError = (...msgs) => log(chalk.red(...msgs));
const logSuccess = (...msgs) => log(chalk.blue(...msgs));

const filePath = path.join(process.cwd(), 'data', '_data.json');

const createSupply = (name) => async (supplyData) => {
    if (Object.hasOwnProperty.call(supplyData, name)) {
        logError('A supply with that name already exists');
        return supplyData;
    }
    supplyData[name] = { amount: 0, identifier: null };
    try {
        const newSupply = await setSupply(supplyData);
        logSuccess('Created a new supply', chalk.yellow(name));
        return newSupply;
    } catch (e) {
        logError(e);
    }
};

const updateSupply = (name, newAmount, identifier) => async (supplyData) => {
    if (!Object.hasOwnProperty.call(supplyData, name)) {
        logError('That supply does not exist');
        return supplyData;
    }
    if (!isNumber(newAmount)) {
        logError('Error: Amounts must be numbers in the current configuration');
        return;
    }
    supplyData[name].amount = newAmount;
    if (identifier) {
        supplyData[name].identifier = identifier;
    }
    try {
        await setSupply(supplyData);
    } catch (e) {
        logError(e);
    }
};

const deleteSupply = (name) => async (supplyData) => {
    if (!Object.hasOwnProperty.call(supplyData, name)) {
        logError('That supply does not exist');
        return supplyData;
    }
    delete supplyData[name];
    try {
        return await setSupply(supplyData);
    } catch (e) {
        logError(e);
    }
};

const decreaseSupply = (name, amount, identifier) => async (supplyData) => {
    if (!Object.hasOwnProperty.call(supplyData, name)) {
        logError('That supply does not exist');
        return supplyData;
    }
    const currVal = supplyData[name].amount;
    const newVal = currVal - amount;
    const newSupply = await updateSupply(name, newVal, identifier)(supplyData);
    logSuccess('Decreased', name, 'to', newVal);
    return newSupply;
};

const increaseSupply = (name, amount, identifier) => async (supplyData) => {
    if (!Object.hasOwnProperty.call(supplyData, name)) {
        logError('That supply does not exist');
        return supplyData;
    }
    const currVal = supplyData[name].amount;
    const newVal = currVal + amount;
    const newSupply = await updateSupply(name, newVal, identifier)(supplyData);
    logSuccess('Increased', name, 'to', newVal);
    return newSupply;
};

const displaySupply = (name) => async (supplyData) => {
    if (!Object.hasOwnProperty.call(supplyData, name)) {
        logError('That supply does not exist');
        return supplyData;
    }
    logSuccess(chalk.yellow(name), 'is currently', chalk.white(supplyData[name].amount));
    if (supplyData[name].identifier) {
        logSuccess(chalk.yellow(name), 'has data', chalk.white(supplyData[name].identifier));
    }
};

const displayAll = () => async (supplyData) => {
    for (const [key, val] of Object.entries(supplyData)) {
        logSuccess('All Supplies');
        logSuccess(key, val.amount);
    }
};

const init = async () => {
    // if no data file yet, create one
    if (!await checkFile(filePath)) {
        try {
            return await createNewDataset();
        } catch (e) {
            logError(e);
        }
    }
};

const determineAction = (args) => {
    const argVector = args['_'];
    if (argVector.includes('create')) {
        const supplyName = args['name'] || args['n'];
        if (supplyName === undefined) {
            logError('Usage: scom create --name [-n] <name>');
            return;
        }
        return createSupply(supplyName);
    }
    if (argVector.includes('show')) {
        const supplyName = argVector[1];
        if (supplyName === undefined) {
            logError('Usage: scom show <supply>');
            return;
        }
        return displaySupply(supplyName);
    }
    if (argVector.includes('increase')) {
        const supplyName = argVector[1];
        const identifier = args['i'] || args['identifier'];
        const amounts = args['e'] || args['element'];
        if (supplyName === undefined) {
            logError('Usage: scom increase <supplyName> [-i [--identifier] <identifier>] -e [--element] <element0>, -e [--element] /* ... ,*/ -e [--element] <elementN>)');
            return;
        }
        return increaseSupply(supplyName, sum(ensureArray(amounts)), identifier);
    }
    if (argVector.includes('decrease')) {
        const supplyName = argVector[1];
        const identifier = args['i'] || args['identifier'];
        const amounts = args['e'] || args['element'];
        if (supplyName === undefined || amounts === undefined) {
            logError('Usage: scom decrease <supplyName> [-i [--identifier] <identifier>] -e [--element] <element0>, -e [--element] /* ... ,*/ -e [--element] <elementN>)');
            return;
        }
        return decreaseSupply(supplyName, sum(ensureArray(amounts)), identifier);
    }
    if (argVector.includes('delete-all')) {
        if (!args['force']) {
            logError('This will destory all saved data!');
            logError('If you wish to destory everything, rerun this command with --force');
            return;
        }
        createNewDataset();
        logSuccess('Data reset');
        return;
    }
    if (argVector.includes('show-all')) {
        return displayAll();
    }
    if (argVector.includes('delete')) {
        const supplyName = argVector[1];
        if (supplyName === undefined) {
            logError('Usage: scom delete <supplyName>');
            return;
        }
        return deleteSupply(supplyName);
    }
    if (argVector.includes('set')) {
        const supplyName = argVector[1];
        const identifier = args['i'] || args['identifier'];
        const amount = args['e'] || args['element'];
        if (supplyName === undefined || amount === undefined) {
            logError('Usage: scom set <supplyName> [-i [--identifier] <identifier>] <amount>');
            return;
        }
        logSuccess('Updated', chalk.yellow(supplyName), 'to', chalk.white(amount));
        return updateSupply(supplyName, amount, identifier);
        
    }
    if (args.helpme) {
        logSuccess('Create a supply', chalk.green('scom create -n [--name] <supplyName>'));
        logSuccess('Increase the amount of a supply', chalk.green('scom increase <identifier> <supplyName> <element0>, <element1>, /* ... ,*/ <elementN>'));
        logSuccess('Decrease the amount of a supply', chalk.green('scom decrease <identifier> <supplyName> <element0>, <element1>, /* ... ,*/ <elementN>'));
        logSuccess('Set the amount of a supply explicitly', chalk.green('scom set <identifier> <supplyName> <element>'));
        logSuccess('Get current amount of supply', chalk.green('scom show <supplyName>'));
        logSuccess('Delete a supply', chalk.green('scom delete <supplyName>'));
        logSuccess('Delete all supplies', chalk.green('scom delete-all <supplyName>'));
        return;
    }
    logError('Unknown command. See scom --help');
};

const main = async () => {
    // make sure files are set up
    await init();
    // parse action from cl args
    const action = determineAction(argv);
    // pipe a fresh supply into the action to effect the change
    pipeAsync(getSupply, action || identity)();
};

main();
