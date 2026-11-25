fn main() {
    tauri_build::try_build(tauri_build::Attributes::new().app_manifest(
        tauri_build::AppManifest::new().commands(&["load_preferences", "save_preferences"]),
    ))
    .expect("could not build AXIOM desktop resources");
}
