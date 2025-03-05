import { useState, useEffect, useReducer } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Paper, 
  Title, 
  Divider, 
  ScrollArea,
  SimpleGrid,
  Container,
  Text,
  Loader,
  Center,
  Code,
  Button,
  Group,
  Badge,
  Tooltip,
  ActionIcon
} from '@mantine/core';
import { 
  FileTree, 
  utils 
} from "@sinm/react-file-tree";
import { IconRefresh, IconFolderFilled } from '@tabler/icons-react';
import FileItemWithFileIcon from "@sinm/react-file-tree/lib/FileItemWithFileIcon";
import "@sinm/react-file-tree/icons.css";
import "@sinm/react-file-tree/styles.css";
import { THEME_COLORS } from '../constants.ts';
import _ from 'lodash';
import { getFilesA, getFilesB } from '../utils/api';

// Custom styles for file tree - Applied directly in head to ensure they're loaded
const fileTreeStyles = `
  .file-tree-container {
    width: 100%;
    min-height: 300px;
    height: 100%;
    border: 1px solid #444;
    padding: 12px;
    border-radius: 4px;
    background-color: #1a1b1e;
    overflow: auto;
    display: block;
  }
  
  .file-tree-container .file-tree__root {
    width: 100%;
    display: block;
  }

  .file-tree__node {
    padding: 6px 0;
    display: block;
  }
  
  .file-tree__item {
    padding: 4px;
    border-radius: 4px;
    margin: 2px 0;
    transition: background-color 0.15s ease;
  }
  
  .file-tree__item:hover {
    background-color: rgba(255, 255, 255, 0.08);
  }
  
  .file-tree__item-content {
    color: #fff;
    font-size: 14px;
    display: flex;
    align-items: center;
  }
  
  .file-tree__item--focused {
    background-color: rgba(51, 154, 240, 0.2);
  }
  
  .status-badge {
    display: inline-block;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
    margin-left: 8px;
    transition: all 0.2s ease;
  }
  
  .status-badge:hover {
    filter: brightness(1.1);
    transform: translateY(-1px);
  }
  
  .file-size {
    font-size: 12px;
    color: #888;
    margin-left: 8px;
    opacity: 0.7;
    transition: opacity 0.2s ease;
  }
  
  .file-tree__item:hover .file-size {
    opacity: 1;
  }
`;

/**
 * Converts flat file list from API to hierarchical tree structure
 */
const convertFilesToTreeFormat = (files) => {
  if (!files || !Array.isArray(files) || files.length === 0) {
    return null;
  }
  
  // Create root node
  const rootNode = {
    uri: '/root',
    type: 'directory',
    expanded: true,
    children: [],
    originalData: {}
  };
  
  // Map to store created directories
  const dirMap = {
    '/root': rootNode
  };
  
  // Process each file and create directories as needed
  files.forEach(file => {
    if (!file.path) {
      return;
    }
    
    // Normalize path and split into segments
    let path = file.path.startsWith('/') ? file.path : '/' + file.path;
    const segments = path.split('/').filter(Boolean);
    
    // Start from root directory
    let currentPath = '/root';
    let parentNode = rootNode;
    
    // Create directories as needed
    for (let i = 0; i < segments.length - 1; i++) {
      const segment = segments[i];
      const dirPath = `${currentPath}/${segment}`;
      
      if (!dirMap[dirPath]) {
        // Create new directory node
        const dirNode = {
          uri: dirPath,
          type: 'directory',
          expanded: true,
          children: [],
          originalData: {}
        };
        
        // Add to parent and update map
        parentNode.children.push(dirNode);
        dirMap[dirPath] = dirNode;
      }
      
      // Update current directory
      currentPath = dirPath;
      parentNode = dirMap[dirPath];
    }
    
    // Add file node to its parent directory
    const fileName = segments[segments.length - 1];
    const filePath = `${currentPath}/${fileName}`;
    
    // Create file node
    const fileNode = {
      uri: filePath,
      type: 'file',
      children: [],
      originalData: {
        path: file.path,
        sizeBytes: file.size_bytes || 0,
        comparisonResult: file.comparison_result || 'baseline'
      }
    };
    
    // Add to parent
    parentNode.children.push(fileNode);
  });
  
  return rootNode;
};

/**
 * Format bytes to human readable format (e.g. 1024 -> 1 KB)
 */
const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Count files in a tree node recursively
 */
const countFiles = (node) => {
  if (!node) return 0;
  if (node.type === 'file') return 1;
  
  return (node.children || []).reduce((sum, child) => sum + countFiles(child), 0);
};

/**
 * Count directories in a tree node recursively
 */
const countDirectories = (node) => {
  if (!node || node.type === 'file') return 0;
  
  // Count current node (if it's a directory) plus all directories in children
  return 1 + (node.children || []).reduce((sum, child) => sum + countDirectories(child), 0);
};

/**
 * Count files by status in a tree node recursively
 */
const countFilesByStatus = (node, status) => {
  if (!node) return 0;
  
  // If this is a file with the specified status, count it
  if (node.type === 'file' && 
      node.originalData && 
      node.originalData.comparisonResult && 
      node.originalData.comparisonResult.toLowerCase() === status.toLowerCase()) {
    return 1;
  }
  
  // Recursively count in children
  return (node.children || []).reduce((sum, child) => 
    sum + countFilesByStatus(child, status), 0);
};

export function FileView() {
  const [treeA, setTreeA] = useState(null);
  const [treeB, setTreeB] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Force update mechanism
  const [, forceUpdate] = useReducer(x => x + 1, 0);

  const navigate = useNavigate();

  // Load styles in document head to ensure they're applied
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = fileTreeStyles;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  // Sort function for tree nodes
  const sorter = (treeNodes) =>
    _.orderBy(
      treeNodes,
      [
        // Directories first
        (node) => (node.type === "directory" ? 0 : 1),
        // Then by name
        (node) => node.uri.toLowerCase(),
      ],
      ["asc", "asc"]
    );

  // Function to fetch file data from API
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [filesA, filesB] = await Promise.all([
        getFilesA(),
        getFilesB()
      ]);

      if (!Array.isArray(filesA) || !Array.isArray(filesB)) {
        throw new Error('Invalid response format from API');
      }

      const treeDataA = convertFilesToTreeFormat(filesA);
      const treeDataB = convertFilesToTreeFormat(filesB);

      setTreeA(treeDataA);
      setTreeB(treeDataB);
      forceUpdate();
    } catch (error) {
      setError(`Failed to fetch data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Call fetchData on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Toggle expanded state for tree nodes
  const toggleExpandedA = (treeNode) => {
    if (treeNode.type === 'directory') {
      treeNode.expanded = !treeNode.expanded;
      forceUpdate();
    }
  };

  const toggleExpandedB = (treeNode) => {
    if (treeNode.type === 'directory') {
      treeNode.expanded = !treeNode.expanded;
      forceUpdate();
    }
  };

  // Custom renderer for file tree nodes
  const itemRenderer = (treeNode, navigate) => {
    let statusColor = null;
    let statusLabel = null;
    let labelStyle = {};
    let statusBgColor = 'transparent';
    
    // Handle file comparison status
    if (treeNode.originalData) {
      if (treeNode.originalData.comparisonResult) {
        const status = treeNode.originalData.comparisonResult.toLowerCase();
        switch (status) {
          case 'added':
            statusColor = '#4caf50';
            statusBgColor = 'rgba(76, 175, 80, 0.15)';
            statusLabel = 'Added';
            labelStyle = { color: '#4caf50', fontWeight: 500 };
            break;
          case 'modified':
            statusColor = '#ff9800';
            statusBgColor = 'rgba(255, 152, 0, 0.15)';
            statusLabel = 'Modified';
            labelStyle = { color: '#ff9800', fontWeight: 500 };
            break;
          case 'removed':
            statusColor = '#f44336';
            statusBgColor = 'rgba(244, 67, 54, 0.15)';
            statusLabel = 'Removed';
            labelStyle = { color: '#f44336', textDecoration: 'line-through', fontWeight: 500 };
            break;
          case 'baseline':
            statusColor = '#2196f3';
            statusBgColor = 'rgba(33, 150, 243, 0.15)';
            statusLabel = 'Baseline';
            labelStyle = { color: '#a0a0a0' };
            break;
          default:
            statusColor = null;
        }
      }
    }
    
    // Get filename from URI path
    const fileName = treeNode.uri.split('/').pop();
    const isDirectory = treeNode.type === 'directory';
    // Get the full path for tooltip
    const fullPath = treeNode.originalData?.path || treeNode.uri;
    
    // Handle file click to view diff
    const handleFileClick = (e) => {
      e.stopPropagation();
      if (!isDirectory && treeNode.originalData?.path) {
        // For files in Folder A
        if (treeNode.originalData.comparisonResult === 'baseline' || 
            treeNode.originalData.comparisonResult === 'modified' ||
            treeNode.originalData.comparisonResult === 'removed') {
          const pathA = treeNode.originalData.path;
          const pathB = treeNode.originalData.comparisonResult === 'removed' ? '' : pathA;
          navigate(`/diff/${encodeURIComponent(pathA)}/${encodeURIComponent(pathB)}`);
        }
        // For files in Folder B
        else if (treeNode.originalData.comparisonResult === 'added') {
          const pathB = treeNode.originalData.path;
          navigate(`/diff//${encodeURIComponent(pathB)}`);
        }
      }
    };
    
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        width: '100%',
        backgroundColor: isDirectory ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
        borderRadius: '4px',
        padding: '4px',
        margin: '2px 0',
        cursor: isDirectory ? 'default' : 'pointer',
        transition: 'background-color 0.2s ease'
      }}
      onClick={handleFileClick}
      >
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          flexGrow: 1, 
          color: isDirectory ? '#fff' : '#ccc'
        }}>
          <FileItemWithFileIcon treeNode={treeNode} />
          <Tooltip 
            label={fullPath} 
            position="bottom-start" 
            withArrow
            transitionProps={{ duration: 200 }}
          >
            <span style={{
              ...labelStyle,
              marginLeft: '4px',
              fontWeight: isDirectory ? 'bold' : labelStyle.fontWeight || 'normal',
              maxWidth: '200px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {fileName}
            </span>
          </Tooltip>
        </div>
        
        {!isDirectory && treeNode.originalData && treeNode.originalData.sizeBytes && (
          <span className="file-size">
            {formatBytes(treeNode.originalData.sizeBytes)}
          </span>
        )}
        
        {statusLabel && (
          <span 
            className="status-badge"
            style={{ 
              backgroundColor: statusBgColor,
              color: statusColor,
              boxShadow: `0 0 0 1px ${statusColor}40`
            }}
          >
            {statusLabel}
          </span>
        )}
      </div>
    );
  };

  // Create customized item renderers with navigation
  const itemRendererWithNavigateA = (treeNode) => itemRenderer(treeNode, navigate);
  const itemRendererWithNavigateB = (treeNode) => itemRenderer(treeNode, navigate);

  // Calculate summary statistics
  const getChangesSummary = () => {
    if (!treeA && !treeB) return null;
    
    const addedCount = countFilesByStatus(treeB, 'added');
    const modifiedCount = countFilesByStatus(treeB, 'modified');
    const removedCount = countFilesByStatus(treeA, 'removed');
    
    return { addedCount, modifiedCount, removedCount };
  };
  
  // Render component
        return (
    <Box p="md" style={{ height: 'calc(100vh - 80px)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <Group spacing="xs">
          <IconFolderFilled size={22} style={{ color: '#607d8b' }}/>
          <Title order={2}>File Comparison</Title>
        </Group>
        <Group>
          <Badge size="lg" variant="outline">Diff Viewer</Badge>
          <Tooltip label="Refresh file tree" withArrow position="bottom">
            <ActionIcon 
              variant="light" 
              color="blue" 
              onClick={fetchData} 
              radius="md"
              size="lg"
            >
              <IconRefresh size={18} stroke={1.5} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </div>
      
      {error && (
        <Paper withBorder p="md" mb="md" style={{ backgroundColor: 'rgba(244, 67, 54, 0.1)', borderColor: '#f44336' }}>
          <Text color="red">{error}</Text>
        </Paper>
      )}
      
      {/* File Changes Summary */}
      {!loading && !error && (
        <Paper p="md" mb="md" withBorder radius="md" style={{
          borderColor: '#444',
          backgroundColor: '#25262b'
        }}>
          <Title order={4} mb="sm">Changes Summary</Title>
          <Divider mb="md" color="#444" />
          <Group spacing="xl" position="apart">
            <Group spacing="xl">
              {getChangesSummary() && (
                <>
                  <Group spacing="xs">
                    <Badge size="lg" color="green" variant={getChangesSummary().addedCount > 0 ? "filled" : "outline"}>
                      {getChangesSummary().addedCount} New Files
                    </Badge>
                    <Text size="sm" color="dimmed">added in Folder B</Text>
                  </Group>
                  
                  <Group spacing="xs">
                    <Badge size="lg" color="orange" variant={getChangesSummary().modifiedCount > 0 ? "filled" : "outline"}>
                      {getChangesSummary().modifiedCount} Modified Files
                    </Badge>
                    <Text size="sm" color="dimmed">changed between folders</Text>
                  </Group>
                  
                  <Group spacing="xs">
                    <Badge size="lg" color="red" variant={getChangesSummary().removedCount > 0 ? "filled" : "outline"}>
                      {getChangesSummary().removedCount} Deleted Files
                    </Badge>
                    <Text size="sm" color="dimmed">missing from Folder B</Text>
                  </Group>
                </>
              )}
            </Group>
            
            <Text 
              size="sm" 
              color="dimmed"
              style={{ fontStyle: 'italic' }}
            >
              Click on any file to view detailed diff
            </Text>
          </Group>
        </Paper>
      )}
      
      <Paper p="md" withBorder radius="md" style={{ 
        height: !loading && !error ? 'calc(100% - 160px)' : 'calc(100% - 60px)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        borderColor: '#444',
        backgroundColor: '#25262b'
      }}>
        <SimpleGrid cols={2} spacing="md" style={{ 
          height: '100%',
          flex: 1,
          overflow: 'hidden'
        }}>
          <Paper withBorder p="md" radius="md" style={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            overflow: 'hidden',
            borderColor: '#444',
            backgroundColor: '#1e1f23'
          }}>
            <Group position="apart" mb="sm">
              <Title order={4}>Folder A</Title>
              {treeA && (
                <Group spacing="xs">
                  <Badge size="sm" color="indigo" variant="filled">
                    {countFiles(treeA)} Files
                  </Badge>
                  <Badge size="sm" color="blue" variant="outline">
                    {countDirectories(treeA) - 1} Directories
                  </Badge>
                </Group>
              )}
            </Group>
            <Divider mb="sm" color="#444" />
            <Box style={{ 
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              height: 'calc(100% - 50px)'
            }}>
              {loading ? (
                <Center style={{ height: '100%' }}>
                  <Loader color="blue" />
                </Center>
              ) : treeA && treeA.children && treeA.children.length > 0 ? (
                <div className="file-tree-container">
                  <FileTree
                    key={`tree-a-${new Date().getTime()}`}
                    itemRenderer={itemRendererWithNavigateA}
                    tree={treeA}
                    onItemClick={toggleExpandedA}
                    sorter={sorter}
                  />
                </div>
              ) : (
                <Center style={{ height: '100%' }}>
                  <Text>No files to display in Folder A</Text>
                </Center>
            )}
          </Box>
          </Paper>

          <Paper withBorder p="md" radius="md" style={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            overflow: 'hidden',
            borderColor: '#444',
            backgroundColor: '#1e1f23'
          }}>
            <Group position="apart" mb="sm">
              <Title order={4}>Folder B</Title>
              {treeB && (
                <Group spacing="xs">
                  <Badge size="sm" color="indigo" variant="filled">
                    {countFiles(treeB)} Files
                  </Badge>
                  <Badge size="sm" color="blue" variant="outline">
                    {countDirectories(treeB) - 1} Directories
                  </Badge>
                </Group>
              )}
            </Group>
            <Divider mb="sm" color="#444" />
            <Box style={{ 
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              height: 'calc(100% - 50px)'
            }}>
              {loading ? (
                <Center style={{ height: '100%' }}>
                  <Loader color="blue" />
                </Center>
              ) : treeB && treeB.children && treeB.children.length > 0 ? (
                <div className="file-tree-container">
                  <FileTree
                    key={`tree-b-${new Date().getTime()}`}
                    itemRenderer={itemRendererWithNavigateB}
                    tree={treeB}
                    onItemClick={toggleExpandedB}
                    sorter={sorter}
                  />
                </div>
              ) : (
                <Center style={{ height: '100%' }}>
                  <Text>No files to display in Folder B</Text>
                </Center>
              )}
          </Box>
            </Paper>
        </SimpleGrid>
      </Paper>
    </Box>
  );
}

export default FileView;
