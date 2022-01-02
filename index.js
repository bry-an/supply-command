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

const updateSupply = ({ name, newAmount, identifier }) => async (supplyData) => {
    if (!Object.hasOwnProperty.call(supplyData, name)) {
        logError('That supply does not exist');
        return supplyData;
    }
    if (newAmount) {
        if (!isNumber(newAmount)) {
            logError('Error: Amounts must be numbers in the current configuration');
            return;
        }
        supplyData[name].amount = newAmount;
    }
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
    const currAmount = supplyData[name].amount;
    const newAmount = currAmount - amount;
    const newSupply = await updateSupply({ name, newAmount, identifier })(supplyData);
    logSuccess('Decreased', name, 'to', newAmount);
    return newSupply;
};

const increaseSupply = (name, amount, identifier) => async (supplyData) => {
    if (!Object.hasOwnProperty.call(supplyData, name)) {
        logError('That supply does not exist');
        return supplyData;
    }
    const currAmount = supplyData[name].amount;
    const newAmount = currAmount + amount;
    const newSupply = await updateSupply({ name, newAmount, identifier })(supplyData);
    logSuccess('Increased', name, 'to', newAmount);
    return newSupply;
};

const displaySupply = (name) => async (supplyData) => {
    if (!Object.hasOwnProperty.call(supplyData, name)) {
        logError('That supply does not exist');
        return supplyData;
    }
    logSuccess(chalk.yellow(name), 'is currently', chalk.white(supplyData[name].amount));
    if (supplyData[name].identifier) {
        logSuccess(chalk.yellow(name), 'has identifier', chalk.white(supplyData[name].identifier));
    }
};

const displayAll = () => async (supplyData) => {
    logSuccess(chalk.green('All Supplies:'));
    for (const [key, val] of Object.entries(supplyData)) {
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
        const name = args['name'] || args['n'];
        if (name === undefined) {
            logError('Usage: ./index.js create --name [-n] <name>');
            return;
        }
        return createSupply(name);
    }
    if (argVector.includes('show')) {
        const name = argVector[1];
        if (name === undefined) {
            logError('Usage: ./index.js show <supply>');
            return;
        }
        return displaySupply(name);
    }
    if (argVector.includes('increase')) {
        const name = argVector[1];
        const identifier = args['i'] || args['identifier'];
        const amounts = args['e'] || args['element'];
        if (name === undefined) {
            logError('Usage: ./index.js increase <supplyName> [-i [--identifier] <identifier>] -e [--element] <element0>, -e [--element] /* ... ,*/ -e [--element] <elementN>');
            return;
        }
        return increaseSupply(name, sum(ensureArray(amounts)), identifier);
    }
    if (argVector.includes('decrease')) {
        const name = argVector[1];
        const identifier = args['i'] || args['identifier'];
        const amounts = args['e'] || args['element'];
        if (name === undefined || amounts === undefined) {
            logError('Usage: ./index.js decrease <supplyName> [-i [--identifier] <identifier>] -e [--element] <element0>, -e [--element] /* ... ,*/ -e [--element] <elementN>');
            return;
        }
        return decreaseSupply(name, sum(ensureArray(amounts)), identifier);
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
        const name = argVector[1];
        if (name === undefined) {
            logError('Usage: ./index.js delete <supplyName>');
            return;
        }
        return deleteSupply(name);
    }
    if (argVector.includes('set')) {
        const name = argVector[1];
        const identifier = args['i'] || args['identifier'];
        const newAmount = args['e'] || args['element'];
        if (name === undefined || newAmount === undefined) {
            logError('Usage: ./index.js set <supplyName> [-i [--identifier] <identifier>] <amount>');
            return;
        }
        logSuccess('Updated', chalk.yellow(name), 'to', chalk.white(newAmount));
        return updateSupply({ name, newAmount, identifier });
        
    }
    if (argVector.includes('set-identifier')) {
        const name = argVector[1];
        const identifier = args['i'] || args['identifier'];
        if (name === undefined || identifier === undefined) {
            logError('Usage: ./index.js set-identifier <supplyName> -i [--identifier] <identifier>');
            return;
        }
        logSuccess('Set identifier for', chalk.yellow(name), 'to', chalk.white(identifier));
        return updateSupply({ name, identifier });
    }
    if (args.usage) {
        logSuccess('Create a supply', chalk.green('./index.js create -n [--name] <supplyName>'));
        logSuccess('Increase the amount of a supply', chalk.green('./index.js increase <supplyName> [-i [--identifier] <identifier>] -e [--element] <element0>, -e [--element] /* ... ,*/ -e [--element] <elementN>'));
        logSuccess('Decrease the amount of a supply', chalk.green('./index.js decrease <supplyName> [-i [--identifier] <identifier>] -e [--element] <element0>, -e [--element] /* ... ,*/ -e [--element] <elementN>'));
        logSuccess('Set the amount of a supply explicitly', chalk.green('./index.js set <supplyName> [-i [--identifier] <identifier>] -e [--element] <element0>, -e [--element] /* ... ,*/ -e [--element] <elementN>'));
        logSuccess('Get current amount of supply', chalk.green('./index.js show <supplyName>'));
        logSuccess('Delete a supply', chalk.green('./index.js delete <supplyName>'));
        logSuccess('Delete all supplies', chalk.green('./index.js delete-all <supplyName>'));
        return;
    }
    logError('Unknown command. See ./index.js --usage');
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
