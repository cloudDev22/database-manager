const mysql = require("mysql");
const { makeDb } = require('mysql-async-simple');
const fs = require('fs');
const LogService = require('./log-service');
const dbConfig = require('./configs/db');

class DatabaseManager {
    constructor() {
        this.db = makeDb();
        this.ScriptFolder = process.env.DB_VERSION_SCRIPT_FOLDER;
        this.log = new LogService();
    }

    async getConnection() {
        if (this.connection) {
            return this.connection;
        }

        const connection = mysql.createConnection({
          host: dbConfig.HOST,
          user: dbConfig.USER,
          password: dbConfig.PASSWORD,
          database: dbConfig.DB,
          multipleStatements: true
        });
    
        await this.db.connect(connection);
        this.connection = connection;
        return connection;
    }

    async ensureVersionTableExists() {
        try {
            await this.db.query(this.connection, `
                CREATE TABLE \`db_schema\` (
                    \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
                    \`name\` varchar(255) DEFAULT NULL,
                    \`executed_time\` timestamp NULL DEFAULT NULL,
                    PRIMARY KEY (\`id\`)
                )
            `);
        } catch (e) {
            if (e.code !== 'ER_TABLE_EXISTS_ERROR') {
                this.log.error(e);
            }
        }
    }

    async execute_script(file) {
        const script = fs.readFileSync(`${this.ScriptFolder}${file}`, 'utf8');
        try {
            await this.db.query(this.connection, script);
            await this.db.query(this.connection, `
                INSERT INTO db_schema(name, executed_time) VALUES ('${file}', '${new Date().toISOString()}');
            `);
            this.log.debug(`Executed ${file}`);
            return true;
        } catch (e) {
            this.log.error(e);
            return false;
        }
    }

    async execute_scripts(create_version_table) {
        const connection = await this.getConnection();
        try {
            if (create_version_table) {
                await this.ensureVersionTableExists();
            }
    
            const dbScriptResult = await this.db.query(connection, `
                SELECT \`name\` FROM db_schema; 
            `);
            var executed_scripts = dbScriptResult.map(m => m.name);
            const scriptFiles = fs.readdirSync(this.ScriptFolder);
            if (scriptFiles == null || scriptFiles.length === 0)
                return;
    
            const scripts = scriptFiles.map(file => {
                return {
                    file,
                    modified: fs.statSync(`${this.ScriptFolder}${file}`).mtime.getTime()
                }
            })
            .sort((a, b) => a.modified - b.modified)
            .map(v => v.file);

            for (let i = 0; i < scripts.length; i++) {
                // check if this is ignored
                const ignoredFiles = process.env.IGNORED_FILES || "";
                const ignoreList = ignoredFiles.split(",");
                if (ignoreList.indexOf(scripts[i]) >= 0) {
                    this.log.debug(`${scripts[i]} ignored.`);
                    continue;
                }
        
                const is_executed_already = executed_scripts.indexOf(scripts[i]);
                if (is_executed_already >= 0) {
                    this.log.debug(`Script '${scripts[i]}' is already executed.`);
                    continue;
                }
        
                const result = await this.execute_script(this.connection, scripts[i]);
                if (!result) {
                    break;
                }
            }
            this.log.debug('Process completed.');
        } catch (e) {
            this.log.error(`There was an error updating database. ${e}`);
        } finally {
            if (this.connection) {
                this.db.close(this.connection);
                this.connection = null;
            }
        }
    }
}

module.exports = DatabaseManager;