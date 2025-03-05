import * as Diff from 'diff';

/**
 * Calculate diff between two strings
 * @param {string} oldContent - Original content
 * @param {string} newContent - New content
 * @param {Object} options - Options for diff
 * @returns {Array} Diff result
 */
export const calculateDiff = (oldContent, newContent, options = {}) => {
  const { ignoreWhitespace = false } = options;
  // Ensure we have strings
  const oldStr = typeof oldContent === 'string' ? oldContent : String(oldContent || '');
  const newStr = typeof newContent === 'string' ? newContent : String(newContent || '');
  
  console.log('calculateDiff - Content types:', {
    oldType: typeof oldContent,
    newType: typeof newContent,
    oldStrType: typeof oldStr,
    newStrType: typeof newStr
  });
  
  return Diff.diffLines(oldStr, newStr, { ignoreWhitespace: false });
};

/**
 * Process a diff result to generate arrays of lines for left and right panes
 * @param {Array} diffResult - Result from diff library
 * @returns {Object} Object with leftLines, rightLines and changeMap arrays
 */
export const processDiff = (diffResult) => {
  // Direct debugging to see what diffResult contains
  console.log('processDiff - Direct input:', {
    isArray: Array.isArray(diffResult),
    length: diffResult?.length || 0,
    sample: diffResult?.slice?.(0, 2)
  });
  
  if (!diffResult || !Array.isArray(diffResult) || diffResult.length === 0) {
    console.log('processDiff: Empty or invalid diffResult', diffResult);
    return { 
      leftLines: [], 
      rightLines: [],
      changeMap: []
    };
  }
  
  let leftLineNum = 1;
  let rightLineNum = 1;
  let leftLines = [];
  let rightLines = [];
  let changeMap = [];
  
  try {
    // Simplify processing for more reliable results
    for (const part of diffResult) {
      if (!part || typeof part.value !== 'string') {
        console.log('processDiff: Invalid diff part', part);
        continue;
      }
      
      // Split content into lines
      const lines = part.value.split('\n');
      
      // Handle the last line (empty if value ends with \n)
      if (lines.length > 0 && lines[lines.length - 1] === '') {
        lines.pop();
      }
      
      // Process each line
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        if (part.added) {
          // Line was added (in right file)
          rightLines.push({
            content: line,
            number: rightLineNum++,
            type: 'added'
          });
          changeMap.push({ type: 'added', left: null, right: rightLines.length - 1 });
        } else if (part.removed) {
          // Line was removed (from left file) 
          leftLines.push({
            content: line,
            number: leftLineNum++,
            type: 'removed'
          });
          changeMap.push({ type: 'removed', left: leftLines.length - 1, right: null });
        } else {
          // Line is unchanged (present in both files)
          leftLines.push({
            content: line,
            number: leftLineNum++,
            type: 'unchanged'
          });
          rightLines.push({
            content: line,
            number: rightLineNum++,
            type: 'unchanged'
          });
          changeMap.push({ 
            type: 'unchanged', 
            left: leftLines.length - 1, 
            right: rightLines.length - 1 
          });
        }
      }
    }
    
    console.log('processDiff - Final result:', {
      leftLinesCount: leftLines.length,
      rightLinesCount: rightLines.length,
      changeMapCount: changeMap.length,
      leftSample: leftLines.slice(0, 2),
      rightSample: rightLines.slice(0, 2),
    });
    
    // Special case - if we still have no lines, generate some dummy lines for testing
    if (leftLines.length === 0 && rightLines.length === 0) {
      console.warn('processDiff: No lines generated, adding fallback content');
      
      // Add simple fallback content to show something is working
      leftLines = [
        { content: 'No content processed in left file', number: 1, type: 'info' }
      ];
      rightLines = [
        { content: 'No content processed in right file', number: 1, type: 'info' }
      ];
      changeMap = [
        { type: 'info', left: 0, right: 0 }
      ];
    }
    
  } catch (error) {
    console.error('Error in processDiff:', error);
  }
  
  return { leftLines, rightLines, changeMap };
};

/**
 * For backwards compatibility
 * @param {Array} diffResult - Result from diff library
 * @returns {Object} Processed diff data
 */
export const processDiffForDisplay = (diffResult) => {
  const { leftLines, rightLines, changeMap } = processDiff(diffResult);
  
  // Generate content for syntax highlighting
  const leftContent = leftLines.map(line => line.content).join('\n');
  const rightContent = rightLines.map(line => line.content).join('\n');
  
  return { leftContent, rightContent, leftLines, rightLines, changeMap };
};

/**
 * Calculate diff statistics from a diff result
 * @param {Array} diffResult - Result from diff library
 * @returns {Object} Object with added, removed, and unchanged counts
 */
export const calculateDiffStats = (diffResult) => {
  if (!diffResult || !Array.isArray(diffResult) || diffResult.length === 0) {
    return { added: 0, removed: 0, unchanged: 0 };
  }
  
  return diffResult.reduce((stats, part) => {
    if (!part || typeof part.value !== 'string') return stats;
    
    const lines = part.value.split('\n').length - 1 || 1; // At least 1 line
    
    if (part.added) {
      stats.added += lines;
    } else if (part.removed) {
      stats.removed += lines;
    } else {
      stats.unchanged += lines;
    }
    
    return stats;
  }, { added: 0, removed: 0, unchanged: 0 });
};

/**
 * Map file extension to language for syntax highlighting
 * @param {string} extension - File extension
 * @returns {string} Language for syntax highlighting
 */
export const getLanguageFromExtension = (extension) => {
  if (!extension) return 'plaintext';
  
  const extensionMap = {
    // JavaScript family
    'js': 'javascript',
    'jsx': 'jsx',
    'ts': 'typescript',
    'tsx': 'tsx',
    'json': 'json',
    
    // Web
    'html': 'html',
    'css': 'css',
    'scss': 'scss',
    'less': 'less',
    'svg': 'xml',
    
    // Backend languages
    'py': 'python',
    'rb': 'ruby',
    'java': 'java',
    'cs': 'csharp',
    'go': 'go',
    'rs': 'rust',
    'php': 'php',
    
    // Markup and config
    'md': 'markdown',
    'mdx': 'markdown',
    'yml': 'yaml',
    'yaml': 'yaml',
    'toml': 'toml',
    'xml': 'xml',
    
    // Shell scripts
    'sh': 'bash',
    'bash': 'bash',
    'zsh': 'bash',
    
    // Other programming languages
    'c': 'c',
    'cpp': 'cpp',
    'dart': 'dart',
    'kotlin': 'kotlin',
    'swift': 'swift',
    
    // SQL and database
    'sql': 'sql',
    
    // Utils
    'dockerfile': 'dockerfile',
    'makefile': 'makefile',
    'gitignore': 'plaintext',
  };
  
  const extLower = extension.toLowerCase();
  return extensionMap[extLower] || 'plaintext';
}; 