# Sudoku Validator

This project is an Angular application that validates Sudoku puzzles. It allows users to input a Sudoku puzzle and checks if the puzzle adheres to the rules of Sudoku.

## Preview
https://www.loom.com/share/e530e6f888424d8293872a2bfd2cf8dd

## Prerequisites

Before you begin, ensure you have met the following requirements:

- You have installed the latest version of [Node.js and npm](https://nodejs.org/en/download/).
- You have installed [Angular CLI](https://angular.io/cli). If not, install it globally on your machine by using the following command:

```bash
npm install -g @angular/cli
```

## Features

- Sudoku input component
- Sudoku validation function
- User-friendly interface
- Handles edge cases such as empty cells or invalid input
- Unit tests and end-to-end tests

## Sudoku Rules

The Sudoku puzzle validation is based on the following rules:

1. Each row must contain the numbers 1 to 9, without repetition.
2. Each column must contain the numbers 1 to 9, without repetition.
3. Each of the nine 3x3 subgrids must contain the numbers 1 to 9, without repetition.

## Project Setup

To get started with the project, follow the instructions below:

1. Clone the repository

```bash
git clone https://github.com/sunnyDev93/sudoku-validator.git
```

2. Navigate into the project directory

```bash
cd sudoku-validator
```

3. Install the dependencies

```bash
npm install
```

4. Run the application

```bash
ng serve
```

The application will be available at `http://localhost:4200`.

## Testing

This project includes unit tests and end-to-end tests. To run the tests, use the following commands:

- Run unit tests

```bash
ng test
```

- Run end-to-end tests

```bash
ng e2e
```
