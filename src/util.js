export const pipe = (...fns) => (arg) => fns.reduce((acc, fn) => fn(acc), arg);
export const compose = (...fns) => (arg) => pipe(...fns.reverse())(arg);

export const pipeAsync = (...fns) => async (arg) => {
    for (let i = 0; i < fns.length; i++) {
        arg = await fns[i](arg);
    }
    return arg;
};

export const identity = (x) => x;
