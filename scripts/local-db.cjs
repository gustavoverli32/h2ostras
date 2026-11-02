const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');
function createLocalDB(filename = ':memory:') {
  const db = new DatabaseSync(filename);
  db.exec('CREATE TABLE IF NOT EXISTS __local_migrations (name TEXT PRIMARY KEY)');
  const dir = path.join(__dirname,'../drizzle');
  for (const name of fs.readdirSync(dir).filter(f=>f.endsWith('.sql')).sort()) {
    if (db.prepare('SELECT name FROM __local_migrations WHERE name=?').get(name)) continue;
    db.exec('BEGIN');try{db.exec(fs.readFileSync(path.join(dir,name),'utf8'));db.prepare('INSERT INTO __local_migrations(name) VALUES(?)').run(name);db.exec('COMMIT')}catch(e){db.exec('ROLLBACK');throw e}
  }
  const prepare = sql => {
    const stmt=db.prepare(sql);let args=[];
    return { bind(...values){args=values;return this}, async first(){return stmt.get(...args)||null}, async all(){return {results:stmt.all(...args)}}, async run(){const result=stmt.run(...args);return {meta:{changes:Number(result.changes)}}} };
  };
  return {prepare,close:()=>db.close()};
}
module.exports={createLocalDB};
