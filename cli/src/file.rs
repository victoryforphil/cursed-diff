use std::path::PathBuf;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ComparsionResult{
    Baseline,
    Added,
    Removed,
    Modified,
    Renamed,
}
impl std::fmt::Display for ComparsionResult{
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{:?}", self)
    }
}

pub struct ScanedFile{
    pub full_path: PathBuf,
    pub small_path: PathBuf,
    pub name: String,
    pub extension: String,
    pub size_bytes: u64,
    pub contents: Option<String>,
    pub comparison_result: Option<ComparsionResult>,
}

impl ScanedFile{
    pub fn new(full_path: PathBuf, root_dir: PathBuf) -> Self{
        let small_path = full_path.strip_prefix(&root_dir).unwrap();
        let name = full_path.file_name().unwrap().to_str().unwrap().to_string();
        let extension = match full_path.extension() {
            Some(ext) => ext.to_str().unwrap_or("").to_string(),
            None => String::new(),
        };
        let size_bytes = full_path.metadata().unwrap().len();
        let contents = None;

        ScanedFile{
            full_path: full_path.clone(),
            small_path: small_path.to_path_buf(),
            name,
            extension,
            size_bytes,
            contents,
            comparison_result: None,
        }
    }
    

    pub fn read_contents(&mut self){
        if let Ok(contents) = std::fs::read_to_string(&self.full_path){
            self.contents = Some(contents);
        }
    }   

    pub fn clear_contents(&mut self){
        self.contents = None;
    }

    pub fn set_comparison_result(&mut self, result: ComparsionResult){
        self.comparison_result = Some(result);
    }
}