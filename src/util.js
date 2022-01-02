export const pipe = (...fns) => (arg) => fns.reduce((acc, fn) => fn(acc), arg);
export const compose = (...fns) => (arg) => pipe(...fns.reverse())(arg);
export const sum = (arr) => arr.reduce((total, item) => total + item, 0);

export const pipeAsync = (...fns) => async (arg) => {
    for (let i = 0; i < fns.length; i++) {
        arg = await fns[i](arg);
    }
    return arg;
};

export const identity = (x) => x;
export const isNumber = (x) => !isNaN(parseInt(x));
export const ensureArray = (x) => Array.isArray(x)
    ? x
    : [x];
