# Blank React App

This is a template project for quickly getting started with writing react with minimal effort. Just clone the repo and go!

## Why?

Because I wanted to learn how the whole transpilation process worked, and what better way to learn than to manually connect the tools to do it?

## Technologies

-   Gulp
-   Browserify
-   Babel
-   ESLint
-   LiveReactLoad
-   Express

## Features

-   React
-   Redux
-   Flow

## Get started

**Clone the repo:**

```sh
git clone https://github.com/FizzyGalacticus/blank-react-app
```

**Go into the directory:**

```sh
cd blank-react-app
```

**Install dependencies:**

```sh
yarn
```

...or if you use _npm_:

```sh
npm install
```

**Start developing:**
By running the following package script, you will start gulp, and it will transpile everything and start listening for changes:

```sh
yarn start
```

You can view your progress by visiting the url `http://localhost:3001`

Changes made to a component _should_ automatically trigger a reload in the page.

**Build for production:**
To build a production version of your app, simply run the build package script:

```sh
yarn build
```

For both development and production, all output is stored in a `docs` directory in the root of the project.

## Known issues

I have to use a [third party](metro-babel7-plugin-react-transform) react transform library, and to use it I have a `postinstall` script to copy it to where it needs to go. If you add/remove/etc any packages with `yarn` or `npm`, attempting to build the project will fail initially and automatically fix things. You'll just have to re-run your build command.
