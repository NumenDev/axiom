use rusqlite::{Connection, OptionalExtension, TransactionBehavior};
use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Preferences {
    version: u32,
    explorer: bool,
    inspector: bool,
    console: bool,
    explorer_width: u32,
    inspector_width: u32,
    console_height: u32,
    compact: bool,
}

impl Preferences {
    fn valid(&self) -> bool {
        self.version == 1
            && (190..=320).contains(&self.explorer_width)
            && (224..=350).contains(&self.inspector_width)
            && (96..=270).contains(&self.console_height)
    }
}

fn db_error(_: rusqlite::Error) -> &'static str {
    "preferences-database-unavailable"
}

pub fn connect(path: &Path) -> Result<Connection, &'static str> {
    let mut db = Connection::open(path).map_err(db_error)?;
    migrate(&mut db)?;
    Ok(db)
}

fn schema_version(db: &Connection) -> Result<u32, &'static str> {
    db.query_row("PRAGMA user_version", [], |row| row.get(0))
        .map_err(db_error)
}

fn migrate(db: &mut Connection) -> Result<(), &'static str> {
    let tx = db
        .transaction_with_behavior(TransactionBehavior::Immediate)
        .map_err(db_error)?;
    match schema_version(&tx)? {
        0 => tx
            .execute_batch(include_str!("../migrations/001_preferences.sql"))
            .map_err(db_error)?,
        1 => (),
        _ => return Err("unsupported-database-version"),
    }
    tx.commit().map_err(db_error)
}

pub fn read(db: &Connection) -> Result<Option<Preferences>, &'static str> {
    if schema_version(db)? != 1 {
        return Err("unsupported-database-version");
    }
    let raw: Option<String> = db
        .query_row("SELECT document FROM preferences WHERE id=1", [], |row| {
            row.get(0)
        })
        .optional()
        .map_err(db_error)?;
    let Some(raw) = raw else { return Ok(None) };
    let json: serde_json::Value = match serde_json::from_str(&raw) {
        Ok(value) => value,
        Err(_) => return Ok(None),
    };
    if json
        .get("version")
        .and_then(|v| v.as_u64())
        .is_some_and(|v| v > 1)
    {
        return Err("unsupported-preferences-version");
    }
    Ok(serde_json::from_value::<Preferences>(json)
        .ok()
        .filter(Preferences::valid))
}

pub fn write(db: &mut Connection, value: Preferences) -> Result<(), &'static str> {
    if !value.valid() {
        return Err("invalid-preferences");
    }
    let document = serde_json::to_string(&value).map_err(|_| "invalid-preferences")?;
    let tx = db
        .transaction_with_behavior(TransactionBehavior::Immediate)
        .map_err(db_error)?;
    read(&tx)?;
    tx.execute("INSERT INTO preferences(id,document) VALUES (1,?1) ON CONFLICT(id) DO UPDATE SET document=excluded.document", [document]).map_err(db_error)?;
    tx.commit().map_err(db_error)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn value() -> Preferences {
        Preferences {
            version: 1,
            explorer: true,
            inspector: false,
            console: true,
            explorer_width: 238,
            inspector_width: 268,
            console_height: 146,
            compact: false,
        }
    }

    #[test]
    fn migration_is_repeatable_and_saved_preferences_survive_reopen() {
        let path = std::env::temp_dir().join(format!(
            "axiom-test-{}-{}.sqlite3",
            std::process::id(),
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        {
            let mut db = connect(&path).unwrap();
            assert_eq!(read(&db), Ok(None));
            write(&mut db, value()).unwrap();
        }
        let mut db = connect(&path).unwrap();
        assert_eq!(read(&db), Ok(Some(value())));
        migrate(&mut db).unwrap();
        let mut updated = value();
        updated.compact = true;
        write(&mut db, updated.clone()).unwrap();
        assert_eq!(read(&db), Ok(Some(updated)));
        drop(db);
        std::fs::remove_file(path).unwrap();
    }

    #[test]
    fn invalid_write_preserves_last_good_document() {
        let mut db = Connection::open_in_memory().unwrap();
        migrate(&mut db).unwrap();
        write(&mut db, value()).unwrap();
        let mut invalid = value();
        invalid.console_height = 0;
        assert_eq!(write(&mut db, invalid), Err("invalid-preferences"));
        assert_eq!(read(&db), Ok(Some(value())));
    }

    #[test]
    fn malformed_documents_recover_and_future_documents_are_protected() {
        let mut db = Connection::open_in_memory().unwrap();
        migrate(&mut db).unwrap();
        db.execute("INSERT INTO preferences VALUES(1,'bad')", [])
            .unwrap();
        assert_eq!(read(&db), Ok(None));
        write(&mut db, value()).unwrap();
        db.execute("UPDATE preferences SET document=?1", [r#"{"version":2}"#])
            .unwrap();
        assert_eq!(read(&db), Err("unsupported-preferences-version"));
        assert_eq!(
            write(&mut db, value()),
            Err("unsupported-preferences-version")
        );
    }

    #[test]
    fn unknown_schema_is_preserved_and_failed_migration_rolls_back() {
        let mut db = Connection::open_in_memory().unwrap();
        db.execute_batch("PRAGMA user_version=2").unwrap();
        assert_eq!(migrate(&mut db), Err("unsupported-database-version"));
        assert_eq!(write(&mut db, value()), Err("unsupported-database-version"));
        assert_eq!(
            db.query_row("PRAGMA user_version", [], |row| row.get::<_, i32>(0))
                .unwrap(),
            2
        );
        db.execute_batch("PRAGMA user_version=0; CREATE TABLE preferences(x);")
            .unwrap();
        assert_eq!(migrate(&mut db), Err("preferences-database-unavailable"));
        assert_eq!(
            db.query_row("PRAGMA user_version", [], |row| row.get::<_, i32>(0))
                .unwrap(),
            0
        );
    }
}
