use crate::file::ComparsionResult;
use log::{debug, info};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;

use crate::file::ScanedFile;

pub struct FileStore {
    pub files_a: Vec<ScanedFile>,
    pub files_b: Vec<ScanedFile>,
}

impl FileStore {
    pub fn new(folder_a: PathBuf, folder_b: PathBuf) -> Self {
        let mut files_a = Vec::new();
        let mut files_b = Vec::new();

        debug!("Scanning folder_a: {}", folder_a.display());
        // Recursively find all files in folder_a
        Self::scan_directory(&folder_a, &folder_a, &mut files_a);

        debug!("Scanning folder_b: {}", folder_b.display());
        // Recursively find all files in folder_b
        Self::scan_directory(&folder_b, &folder_b, &mut files_b);

        info!(
            "Loaded {} files (A: {}) (B: {})",
            files_a.len() + files_b.len(),
            files_a.len(),
            files_b.len()
        );
        FileStore { files_a, files_b }
    }

    fn scan_directory(dir: &PathBuf, root_dir: &PathBuf, files: &mut Vec<ScanedFile>) {
        if let Ok(entries) = fs::read_dir(dir) {
            for entry_result in entries {
                if let Ok(entry) = entry_result {
                    let path = entry.path();
                    debug!("Scanning path: {}", path.display());

                    if path.is_file() {
                        // Add file to our collection
                        if let Ok(metadata) = path.metadata() {
                            debug!(
                                "Adding file: {} (size: {} bytes)",
                                path.display(),
                                metadata.len()
                            );
                            let file = ScanedFile::new(path, root_dir.clone());
                            files.push(file);
                        } else {
                            debug!("Cannot read metadata for file: {}", path.display());
                        }
                    } else if path.is_dir() {
                        // Recursively scan subdirectories
                        Self::scan_directory(&path, root_dir, files);
                    } else {
                        debug!("Skipping non-regular file: {}", path.display());
                    }
                } else {
                    debug!("Error accessing directory entry");
                }
            }
        } else {
            debug!("Failed to read directory {}", dir.display());
        }
    }

    pub fn compare_files(&mut self) {
        // Create a map of small_path to file for quick lookup
        let mut files_a_map: HashMap<String, usize> = HashMap::new();

        // Index files_a by their small_path for quick lookup
        for (index, file) in self.files_a.iter().enumerate() {
            files_a_map.insert(file.small_path.to_string_lossy().to_string(), index);
        }

        // Set all files in A as baseline
        for file_a in &mut self.files_a {
            file_a.set_comparison_result(ComparsionResult::Baseline);
        }

        // Compare files in B with files in A
        for file_b in &mut self.files_b {
            let small_path_b = file_b.small_path.to_string_lossy().to_string();

            if let Some(&index_a) = files_a_map.get(&small_path_b) {
                // File exists in both A and B, check if content is different
                let file_a = &mut self.files_a[index_a];

                // Read contents if they haven't been read yet
                if file_a.contents.is_none() {
                    file_a.read_contents();
                }
                if file_b.contents.is_none() {
                    file_b.read_contents();
                }

                // Compare contents
                if file_a.contents != file_b.contents {
                    file_b.set_comparison_result(ComparsionResult::Modified);
                } else {
                    file_b.set_comparison_result(ComparsionResult::Baseline);
                }

                // Clear contents to save memory
                file_a.clear_contents();
                file_b.clear_contents();
            } else {
                // File exists only in B, mark as added
                file_b.set_comparison_result(ComparsionResult::Added);
            }
        }

        // Find files that exist only in A (removed in B)
        let b_paths: Vec<String> = self
            .files_b
            .iter()
            .map(|f| f.small_path.to_string_lossy().to_string())
            .collect();

        for file_a in &mut self.files_a {
            let small_path_a = file_a.small_path.to_string_lossy().to_string();
            if !b_paths.contains(&small_path_a) {
                file_a.set_comparison_result(ComparsionResult::Removed);
            }
        }

        // Log comparison results
        let baseline_count = self
            .files_a
            .iter()
            .filter(|f| f.comparison_result == Some(ComparsionResult::Baseline))
            .count()
            + self
                .files_b
                .iter()
                .filter(|f| f.comparison_result == Some(ComparsionResult::Baseline))
                .count();
        let added_count = self
            .files_b
            .iter()
            .filter(|f| f.comparison_result == Some(ComparsionResult::Added))
            .count();
        let removed_count = self
            .files_a
            .iter()
            .filter(|f| f.comparison_result == Some(ComparsionResult::Removed))
            .count();
        let modified_count = self
            .files_b
            .iter()
            .filter(|f| f.comparison_result == Some(ComparsionResult::Modified))
            .count();

        info!(
            "Comparison results: {} baseline, {} added, {} removed, {} modified",
            baseline_count, added_count, removed_count, modified_count
        );
    }
}
