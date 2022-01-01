import { writeFileAsJson, readFileAsJson } from './fsUtil.js';
import { EMPTY_DATASET } from './constants.js';
import path from 'path';

const FILEPATH = path.join(process.cwd(), 'data', '_data.json');

export const getSupply = () => {
    return readFileAsJson(FILEPATH);
};

export const setSupply = async (newSupply) => {
    return writeFileAsJson(FILEPATH, newSupply).then(getSupply);
};

export const createNewDataset = () => {
    return writeFileAsJson(FILEPATH, EMPTY_DATASET);
};
