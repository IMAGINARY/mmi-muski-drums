# Architecture

This application uses the [Muski Drums component library](https://github.com/IMAGINARY/muski-drums)
to provide its central functionality.

Components used are:

- **MuskiDrums**: Provides a drum machine that can generate patterns through AI or randomly.
- **MuskiDrumsManager**: Central management of the AI model and soundfont for any number of drum 
    machines running simultaneously.

## Toolset

This is a Webpack-based single page application. Webpack takes care of bundling JS and SASS files,
and generating the HTML file that hosts them.

## Main source files

(all paths relative to `src/js`)

- [`main.js`](src/js/main.js): Main entry point. It loads the configuration, translations, and
  handles the main app and an app scaler to resize it to the screen.
- [`lib/app.js`](src/js/lib/app.js): The main application component. It creates the main
  Muski Drums components and handles the UI around them.

## Main directories

- `art`: Source art assets (Adobe Illustrator format).
- `config`: Data used by the app.
- `scripts`: Build and deployment scripts.
- `src`: The main source code of the app (HTML, SASS and JS files
- `static`: Static assets (e.g. images, icons, etc.)
- `tr`: Translation files.
