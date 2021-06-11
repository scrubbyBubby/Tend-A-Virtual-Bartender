# Tend - A Virtual Bartender

### How to run
Clone the repo and then navigate a terminal to the main project file and run
> npm install
to install top level node_modules, then
> yarn dev-install
to install node_modules for server and client sub-folders, then
> yarn dev-start
to launch a development server of the site running locally.

### Overview
This project is an SPA utilizing the free CocktailDB API to allow users to search for drinks/cocktails, create drink lists, give scores to drinks, and track ingredients/glassware.

### Stack
I'm using a MongoDB, Express.js, React.js, and Node.js stack with mongoose.js for handling the MongoDB connection, and passport.js for user authentication. If a user does not create an account, they are still able to use the site, but their user data is stored in the localStorage. While signed in, all changes are stored in the MongoDB and can be accessed from other devices if logged in on them.

### Goals
This is primarily a project to include in my Web Development portfolio. Elements of the site have been chosen to demonstrate a variety of skills, such as HTTP requests, interacting with public APIs, full stack development, database storage and retrieval, user authentication, input validation, and password encryption. The styling is intentionally minimalistic because the focus was primarily JavaScript and Node.js.
