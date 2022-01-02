# Supply and Command

## Description

A CLI tool to easily manage counts of things. Can be counts of anything, widgets, dollars, minutes, etc.

## Usage

index.js is currently executable. From the project root, after running `npm i`:

`./index.js --usage` will give a list of available commands.  

### Identifier
Passing an identifier allows you to characterize the state of a particular data point.
For example, assume you want to easily keep track of daily rainfall amounts for a month. You can know whether a particular day's value has been logged
by passing the day of the month as an identifier.

```
./index.js increase rainfall -e 1.35 -i 22
```

When you run `./index.js show rainfall`, it will display the identifier, so you'll know up to what date your data is valid.

## Examples

Create a supply
```
./index.js create -n widgets
```

Increase a supply by 100

```
./index.js increase widgets -e 100
```

Set a supply to 1000

```
./index.js set widgets -e 1000
```

Set a supply to 1000 and provide an identifier

```
./index.js set widgets -e 1000 -i 5
```

Increase a supply by multiple amounts

```
./index.js increase widgets -e 10 -e 10 -e10
```

Show a supply
```
./index.js show widgets
=> widgets is currently 1030
=> widgets has identifier 5
```

`widgets` still has data 5 since no identifier was passed in the last increase command.

Remove a supply
```
./index.js delete widgets
```

## Under the hood

Supply command works by creating a `_data.json` file in the `/data/` directory to store key/value pairs representing supplies. This file is untracked by git for privacy.
