import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { pipeAsync } from './src/util.js';
import { EMPTY_DATASET } from './constants.js';

const log = console.log;
const logError = (...msgs) => log(chalk.red(...msgs));
const logSuccess = (...msgs) => log(chalk.blue(...msgs));

const filePath = path.join(process.cwd(), 'data', '_data.json');

const getSupply = async () => {
    let supply = '';
    try {
        supply = await fs.promises.readFile(filePath, 'utf8');
    } catch (e) {
        logError('Error getting supply', e);
    }
    
    return JSON.parse(supply);
};

const setSupply = async (newSupply) => {
    const jsonString = JSON.stringify(newSupply);

    try {
        return await fs.promises.writeFile(filePath, jsonString).then(getSupply);
    } catch (e) {
        logError('Error getting supply', e);
    }
};

const displaySupply = (name) => (supplyData) => {
    if (!Object.hasOwnProperty.call(supplyData, name)) {
        logError('A supply with that name does not exist');
        return;
    }
    logSuccess('Current supply:', supplyData[name]);
    return supplyData;
};

const addSupply = (name) => async (supplyData) => {
    if (Object.hasOwnProperty.call(supplyData, name)) {
        logError('A supply with that name already exists');
        return supplyData;
    }
    supplyData[name] = 0;
    return await setSupply(supplyData);

};

const checkFile = async (filePath) => {
    try {
        await fs.promises.stat(filePath); 
    } catch {
        return false;
    }
    return true;
};

const init = async () => {
    // if no data file yet, create one
    if (!await checkFile(filePath)) {
        return await fs.promises.writeFile(filePath, JSON.stringify(EMPTY_DATASET));
    }
};

const main = async (...actions) => {
    await init();
    const initialSupplyData = await getSupply();
    const piped = pipeAsync(...actions);
    const newSupply = await piped(initialSupplyData);
    logSuccess('New supply:', JSON.stringify(newSupply));
};

main(addSupply('alright'));


// Combine styled and normal strings
// log(chalk.blue('Hello') + ' World' + chalk.red('!'));

// Compose multiple styles using the chainable API
// log(chalk.blue.bgRed.bold('Hello world!'));

// Pass in multiple arguments
// log(chalk.blue('Hello', 'World!', 'Foo', 'bar', 'biz', 'baz'));

// Nest styles
// log(chalk.red('Hello', chalk.underline.bgBlue('world') + '!'));

// Nest styles of the same type even (color, underline, background)
// log(chalk.green(
// 	'I am a green line ' +
// 	chalk.blue.underline.bold('with a blue substring') +
// 	' that becomes green again!'
// ));
//
