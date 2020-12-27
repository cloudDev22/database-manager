# database-manager

This package helps with versioning the database in node.js projects. The .env.sample file has a list of all environment variables required to setup the project.

```
DBHOST=dbserver host
DBUSER=db user
DBPASSWORD=db password
DBNAME=db name
DBPORT=3306
DB_VERSION_SCRIPT_FOLDER=./scripts/
LOG_LEVELS=DEBUG
```
After you have the environment variables setup just include database-manager in your script and start versioning.

```
require('custom-env').env(true);
require('dotenv').config();

const DatabaseManager = require('database-manager');

(async () => {
    var executor = new DatabaseManager();
    await executor.execute_scripts(false);
})();
```
