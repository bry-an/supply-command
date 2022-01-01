import chalk from 'chalk';
import path from 'path';
import { pipeAsync } from './src/util.js';
import { checkFile } from './src/fsUtil.js';
import { getSupply, setSupply, createNewDataset  } from './src/supplyCommand.js';

const log = console.log;
const logError = (...msgs) => log(chalk.red(...msgs));
const logSuccess = (...msgs) => log(chalk.blue(...msgs));

const filePath = path.join(process.cwd(), 'data', '_data.json');

const createSupply = (name) => async (supplyData) => {
    if (Object.hasOwnProperty.call(supplyData, name)) {
        logError('A supply with that name already exists');
        return supplyData;
    }
    supplyData[name] = 0;
    try {
        return await setSupply(supplyData);
    } catch (e) {
        logError(e);
    }
};

const updateSupply = (name, newAmount) => async (supplyData) => {
    if (!Object.hasOwnProperty.call(supplyData, name)) {
        logError('That supply does not exist');
        return supplyData;
    }
    supplyData[name] = newAmount;
    try {
        return await setSupply(supplyData);
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

const reduceSupply = (name, amount) => async (supplyData) => {
    if (!Object.hasOwnProperty.call(supplyData, name)) {
        logError('That supply does not exist');
        return supplyData;
    }
    const currVal = supplyData[name];
    const newVal = currVal - amount;
    return await updateSupply(name, newVal)(supplyData);
};

const increaseSupply = (name, amount) => async (supplyData) => {
    if (!Object.hasOwnProperty.call(supplyData, name)) {
        logError('That supply does not exist');
        return supplyData;
    }
    const currVal = supplyData[name];
    const newVal = currVal + amount;
    return await updateSupply(name, newVal)(supplyData);
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

const main = async (...actions) => {
    await init();
    const initialSupplyData = await getSupply();
    const piped = pipeAsync(...actions);
    const newSupply = await piped(initialSupplyData);
    logSuccess('New supply:', JSON.stringify(newSupply));
};

