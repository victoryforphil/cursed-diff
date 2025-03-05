mod file;
mod filestore;
use clap::{Parser, ValueEnum};
use filestore::FileStore;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use axum::{
    Router,
    routing::{get},
    extract::{State, Path},
    response::Json,
    http::{StatusCode, HeaderValue, Method},
};
use tower_http::cors::{CorsLayer, Any};
use serde::Serialize;
use crate::file::ComparsionResult;

#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Args {
    /// Path to the first folder for comparison
    #[arg(short = 'a', long)]
    folder_a: PathBuf,

    /// Path to the second folder for comparison
    #[arg(short = 'b', long)]
    folder_b: PathBuf,

    /// Viewer mode for displaying differences
    #[arg(short, long, value_enum, default_value_t = ViewerMode::Web)]
    mode: ViewerMode,
    
    /// Port to use for the web server
    #[arg(short, long, default_value_t = 3000)]
    port: u16,
}

#[derive(Copy, Clone, Debug, PartialEq, Eq, ValueEnum)]
enum ViewerMode {
    /// Web-based viewer (default)
    Web,
    /// Native application viewer
    Native,
    /// Command-line interface viewer
    Cli,
    /// Static HTML output
    Static,
}

// Serializable structs for our API responses
#[derive(Serialize)]
struct FileInfo {
    name: String,
    path: String,
    extension: String,
    size_bytes: u64,
    comparison_result: String,
}

#[derive(Serialize)]
struct FileContents {
    name: String,
    path: String,
    contents: String,
}

// Define app state to hold the FileStore
type AppState = Arc<Mutex<FileStore>>;

#[tokio::main]
async fn main() {
    pretty_env_logger::init();
    let args = Args::parse();

    let mut filestore = FileStore::new(args.folder_a, args.folder_b);
    filestore.compare_files();
    let shared_state = Arc::new(Mutex::new(filestore));
    
    match args.mode {
        ViewerMode::Web => {
            // Set up CORS
            let cors = CorsLayer::new()
                .allow_origin("http://localhost:5173".parse::<HeaderValue>().unwrap())
                .allow_methods([Method::GET])
                .allow_headers(Any);
                
            // Define routes for web viewer
            let app = Router::new()
                .route("/api/files/a", get(get_files_a))
                .route("/api/files/b", get(get_files_b))
                .route("/api/files/a/{file_index}/contents", get(get_file_a_contents))
                .route("/api/files/b/{file_index}/contents", get(get_file_b_contents))
                .layer(cors)
                .with_state(shared_state);

            let addr = std::net::SocketAddr::from(([127, 0, 0, 1], args.port));
            println!("Starting web server on http://{}", addr);
            
            let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
            axum::serve(listener, app).await.unwrap();
        },
        ViewerMode::Native => {
            println!("Native mode not implemented yet");
        },
        ViewerMode::Cli => {
            println!("CLI mode not implemented yet");
        },
        ViewerMode::Static => {
            println!("Static mode not implemented yet");
        }
    }
}

// Route handlers
async fn get_files_a(State(state): State<AppState>) -> Json<Vec<FileInfo>> {
    let guard = state.lock().unwrap();
    let files = &guard.files_a;
    
    let file_infos = files.iter().map(|file| {
        let comparison_result = match file.comparison_result {
            Some(ComparsionResult::Baseline) => "baseline".to_string(),
            Some(ComparsionResult::Added) => "added".to_string(),
            Some(ComparsionResult::Removed) => "removed".to_string(),
            Some(ComparsionResult::Modified) => "modified".to_string(),
            Some(ComparsionResult::Renamed) => "renamed".to_string(),
            None => "unknown".to_string(),
        };
        
        FileInfo {
            name: file.name.clone(),
            path: file.small_path.to_string_lossy().to_string(),
            extension: file.extension.clone(),
            size_bytes: file.size_bytes,
            comparison_result,
        }
    }).collect();
    
    Json(file_infos)
}

async fn get_files_b(State(state): State<AppState>) -> Json<Vec<FileInfo>> {
    let guard = state.lock().unwrap();
    let files = &guard.files_b;
    
    let file_infos = files.iter().map(|file| {
        let comparison_result = match file.comparison_result {
            Some(ComparsionResult::Baseline) => "baseline".to_string(),
            Some(ComparsionResult::Added) => "added".to_string(),
            Some(ComparsionResult::Removed) => "removed".to_string(),
            Some(ComparsionResult::Modified) => "modified".to_string(),
            Some(ComparsionResult::Renamed) => "renamed".to_string(),
            None => "unknown".to_string(),
        };
        
        FileInfo {
            name: file.name.clone(),
            path: file.small_path.to_string_lossy().to_string(),
            extension: file.extension.clone(),
            size_bytes: file.size_bytes,
            comparison_result,
        }
    }).collect();
    
    Json(file_infos)
}

async fn get_file_a_contents(
    State(state): State<AppState>,
    Path(file_index): Path<usize>,
) -> Result<Json<FileContents>, StatusCode> {
    let mut file_store = state.lock().unwrap();
    
    if file_index >= file_store.files_a.len() {
        return Err(StatusCode::NOT_FOUND);
    }
    
    // Read file contents if not already loaded
    file_store.files_a[file_index].read_contents();
    
    if let Some(contents) = &file_store.files_a[file_index].contents {
        let file = &file_store.files_a[file_index];
        Ok(Json(FileContents {
            name: file.name.clone(),
            path: file.small_path.to_string_lossy().to_string(),
            contents: contents.clone(),
        }))
    } else {
        Err(StatusCode::NOT_FOUND)
    }
}

async fn get_file_b_contents(
    State(state): State<AppState>,
    Path(file_index): Path<usize>,
) -> Result<Json<FileContents>, StatusCode> {
    let mut file_store = state.lock().unwrap();
    
    if file_index >= file_store.files_b.len() {
        return Err(StatusCode::NOT_FOUND);
    }
    
    // Read file contents if not already loaded
    file_store.files_b[file_index].read_contents();
    
    if let Some(contents) = &file_store.files_b[file_index].contents {
        let file = &file_store.files_b[file_index];
        Ok(Json(FileContents {
            name: file.name.clone(),
            path: file.small_path.to_string_lossy().to_string(),
            contents: contents.clone(),
        }))
    } else {
        Err(StatusCode::NOT_FOUND)
    }
}
