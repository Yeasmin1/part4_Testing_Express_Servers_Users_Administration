// The index.js file only imports the actual application from the app.js file and then starts the application. The function info of the logger-module is used for the console printout telling that the application is running.
// The contents of the index.js file used for starting the application gets simplified as follows:
const app = require('./app') // the actual Express application
const config = require('./utils/config')
const logger = require('./utils/logger')

app.listen(config.PORT, () => {
  logger.info(`Server running on port ${config.PORT}`) // The function info of the logger-module is used for the console printout telling that the application is running
})