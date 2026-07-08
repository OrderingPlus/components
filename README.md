# Finitless — Ordering Components

## Description

This repository contains a collection of functional components built with React Hooks and ES6. Each component is designed to be flexible and reusable, accepting any UI for use. The components are organized and structured with a focus on readability and maintainability.

**Repository:** [Finitless-com/ordering-components](https://github.com/Finitless-com/ordering-components)

## Components

The components in this repository are functional components, meaning they are stateless and do not have lifecycle methods. They are built using React Hooks, which allow us to manage state and side effects in these functional components.

## Usage

To use these components, simply import them into your project and pass in the necessary props. Each component accepts any UI for use, providing flexibility in how they are used and displayed.

## Installation

These components can be used as a submodule in another repository. To do so, add this repository as a submodule to your project:

```
git submodule add https://github.com/Finitless-com/ordering-components.git src/@/components
```

Or clone a parent repo that already includes it:

```
git clone --recursive https://github.com/Finitless-com/website-marketplace-v26.git
```

Once added, you can import the components directly from the submodule. This allows you to keep your project and these components separate, making updates and maintenance easier.

## Format code

Run `yarn lint` to execute the linter.
