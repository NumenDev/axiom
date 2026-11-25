#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
mod preferences;
use preferences::Preferences;
use rusqlite::Connection;
use std::sync::Mutex;
use tauri::{Manager, State};

type Database = Mutex<Result<Connection, &'static str>>;

#[tauri::command]
fn load_preferences(db: State<Database>) -> Result<Option<Preferences>, &'static str> {
    let guard = db.lock().map_err(|_| "database-busy")?;
    preferences::read(guard.as_ref().map_err(|e| *e)?)
}

#[tauri::command]
fn save_preferences(db: State<Database>, preferences: Preferences) -> Result<(), &'static str> {
    let mut guard = db.lock().map_err(|_| "database-busy")?;
    preferences::write(guard.as_mut().map_err(|e| *e)?, preferences)
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let db = app
                .path()
                .app_data_dir()
                .map_err(|_| "data-directory-unavailable")
                .and_then(|dir| {
                    std::fs::create_dir_all(&dir).map_err(|_| "data-directory-unavailable")?;
                    preferences::connect(&dir.join("workspace.sqlite3"))
                });
            app.manage(Mutex::new(db));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![load_preferences, save_preferences])
        .run(tauri::generate_context!())
        .expect("could not run AXIOM desktop");
}
