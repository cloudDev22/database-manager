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
After you have the environment variables setup just include database-manager in your script and start versioning. The scripts folder contains a series of .sql files.

This package maintains history of executed scripts in a table inside the database and only executes scripts
which have not been executed before.

```
require('custom-env').env(true);
require('dotenv').config();

const DatabaseManager = require('database-manager');

(async () => {
    var executor = new DatabaseManager();
    await executor.execute_scripts(true); // set false if history table already exists
})();
```

Project website
```
https://github.com/hashgit/database-manager
```