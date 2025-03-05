import { 
  Stack, 
  Text, 
  Group, 
  UnstyledButton, 
  rem, 
  Title, 
  Divider, 
  ScrollArea,
  Badge,
  Accordion,
  Flex,
  Tooltip,
  Loader,
  Center,
  Box
} from '@mantine/core'
import { 
  IconFolderOpen,
  IconGitCompare,
  IconHistory,
  IconFiles,
  IconFile,
  IconFileText,
  IconStar,
  IconFolderFilled,
  IconFolder
} from '@tabler/icons-react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useComparisonHistory } from '../hooks'
import { useState, useEffect } from 'react'

/**
 * NavbarLink - Navigation link component for sidebar
 * 
 * @param {Object} props - Component properties
 * @param {React.Component} props.icon - Icon component to display
 * @param {string} props.label - Label text
 * @param {string} props.to - Route path
 * @param {boolean} props.active - Whether this link is active
 */
function NavbarLink({ 
  icon: Icon, 
  label, 
  to, 
  active,
  count
}) {
  return (
    <NavLink to={to} style={{ textDecoration: 'none' }}>
      <UnstyledButton
        style={{
          display: 'block',
          width: '100%',
          padding: `${rem(8)} ${rem(12)}`,
          borderRadius: rem(6),
          color: active ? 'var(--mantine-primary-color)' : 'inherit',
          backgroundColor: active ? 'var(--mantine-primary-color-light)' : 'transparent',
        }}
      >
        <Group justify="space-between">
          <Group>
            {Icon && <Icon size={16} />}
            <Text size="sm">{label}</Text>
          </Group>
          {count > 0 && <Badge size="xs" variant="light">{count}</Badge>}
        </Group>
      </UnstyledButton>
    </NavLink>
  )
}

/**
 * Converts flat file list from API to hierarchical tree structure
 * This is a simplified version of the same function from FileView.jsx
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
          expanded: false, // Default to collapsed in sidebar 
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
        comparisonResult: file.comparison_result || 'baseline'
      }
    };
    
    // Add to parent
    parentNode.children.push(fileNode);
  });
  
  return rootNode;
};

/**
 * Recursive component to render a file tree
 */
function FileTreeNode({ node, level = 0, onToggle, onFileClick }) {
  const indentation = level * 16;
  const isDirectory = node.type === 'directory';
  const fileName = node.uri.split('/').pop();
  
  // Handle status color/label for files
  let statusColor = null;
  let labelStyle = {};
  
  if (node.originalData?.comparisonResult) {
    const status = node.originalData.comparisonResult.toLowerCase();
    switch (status) {
      case 'added':
        statusColor = 'green';
        labelStyle = { color: '#4caf50' };
        break;
      case 'modified':
        statusColor = 'yellow';
        labelStyle = { color: '#ff9800' };
        break;
      case 'removed':
        statusColor = 'red';
        labelStyle = { color: '#f44336', textDecoration: 'line-through' };
        break;
      case 'baseline':
        statusColor = 'blue';
        break;
      default:
        statusColor = null;
    }
  }
  
  return (
    <Box>
      <Tooltip label={node.originalData?.path || node.uri} position="right" withArrow>
        <UnstyledButton 
          onClick={() => isDirectory ? onToggle(node) : onFileClick(node)} 
          px={4} 
          py={4}
          style={{ 
            width: '100%', 
            textAlign: 'left',
            borderRadius: 4,
            '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' }
          }}
        >
          <Group pl={indentation} spacing="xs" noWrap>
            {isDirectory ? (
              node.expanded ? <IconFolderOpen size={14} /> : <IconFolder size={14} />
            ) : (
              <IconFileText size={14} />
            )}
            <Text 
              size="xs" 
              truncate 
              style={{ 
                ...labelStyle, 
                fontWeight: isDirectory ? 500 : 400,
                maxWidth: `calc(100% - ${indentation + 30}px)`
              }}
            >
              {fileName}
            </Text>
            {!isDirectory && statusColor && (
              <Badge size="xs" color={statusColor} variant="dot" />
            )}
          </Group>
        </UnstyledButton>
      </Tooltip>
      
      {/* Render children if directory is expanded */}
      {isDirectory && node.expanded && node.children.map((child, index) => (
        <FileTreeNode 
          key={child.uri || index} 
          node={child} 
          level={level + 1}
          onToggle={onToggle}
          onFileClick={onFileClick}
        />
      ))}
    </Box>
  );
}

/**
 * Component to render a file tree section
 */
function FileTreeSection({ title, files, isLoading }) {
  const [treeData, setTreeData] = useState(null);
  const navigate = useNavigate();
  
  // Process files into tree format
  useEffect(() => {
    if (files && files.length > 0) {
      const processedTree = convertFilesToTreeFormat(files);
      setTreeData(processedTree);
    }
  }, [files]);
  
  // Toggle directory expanded state
  const handleToggle = (node) => {
    if (node.type === 'directory') {
      node.expanded = !node.expanded;
      // Force update by creating a new reference
      setTreeData({ ...treeData });
    }
  };
  
  // Handle file click to view diff
  const handleFileClick = (node) => {
    if (node.type === 'file' && node.originalData?.path) {
      // For files in Folder A
      if (node.originalData.comparisonResult === 'baseline' || 
          node.originalData.comparisonResult === 'modified' ||
          node.originalData.comparisonResult === 'removed') {
        const pathA = node.originalData.path;
        const pathB = node.originalData.comparisonResult === 'removed' ? '' : pathA;
        navigate(`/diff/${encodeURIComponent(pathA)}/${encodeURIComponent(pathB)}`);
      }
      // For files in Folder B
      else if (node.originalData.comparisonResult === 'added') {
        const pathB = node.originalData.path;
        navigate(`/diff//${encodeURIComponent(pathB)}`);
      }
    }
  };
  
  return (
    <Box>
      <Accordion.Item value={title.toLowerCase().replace(/\s+/g, '-')}>
        <Accordion.Control icon={<IconFolderOpen size={16} />}>
          {title}
        </Accordion.Control>
        <Accordion.Panel>
          {isLoading ? (
            <Center py="sm">
              <Loader size="xs" />
            </Center>
          ) : treeData && treeData.children && treeData.children.length > 0 ? (
            <Box>
              {treeData.children.map((child, index) => (
                <FileTreeNode 
                  key={child.uri || index} 
                  node={child} 
                  onToggle={handleToggle}
                  onFileClick={handleFileClick}
                />
              ))}
            </Box>
          ) : (
            <Text size="xs" color="dimmed" ta="center" py="sm">
              No files available
            </Text>
          )}
        </Accordion.Panel>
      </Accordion.Item>
    </Box>
  );
}

/**
 * Sidebar - Main sidebar navigation component
 * 
 * Provides navigation between views and file selection options
 */
export function Sidebar() {
  const location = useLocation();
  const { recentComparisons, starredComparisons } = useComparisonHistory();
  const [sourceFiles, setSourceFiles] = useState([]);
  const [targetFiles, setTargetFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch files from API
  useEffect(() => {
    const fetchFiles = async () => {
      try {
        setLoading(true);
        
        const [responseA, responseB] = await Promise.all([
          fetch('http://localhost:3000/api/files/a'),
          fetch('http://localhost:3000/api/files/b')
        ]);

        if (responseA.ok && responseB.ok) {
          const filesA = await responseA.json();
          const filesB = await responseB.json();
          
          if (Array.isArray(filesA) && Array.isArray(filesB)) {
            setSourceFiles(filesA);
            setTargetFiles(filesB);
          }
        }
      } catch (error) {
        console.error('Error fetching files:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFiles();
  }, []);
  
  return (
    <Stack h="100%" style={{ justifyContent: 'space-between' }}>
      <Stack>
        <Title order={4} mb="xs">Cursed Diff</Title>
        
        <Divider my="sm" />
        
        <ScrollArea style={{ height: 'calc(100vh - 180px)' }}>
          <Stack>
            <NavbarLink 
              icon={IconFiles}
              label="Files"
              to="/"
              active={location.pathname === '/'}
            />
            
            <NavbarLink 
              icon={IconHistory}
              label="Recent Comparisons"
              to="/history"
              count={recentComparisons.length}
              active={location.pathname === '/history'}
            />

            <NavbarLink 
              icon={IconStar}
              label="Starred"
              to="/history"
              count={starredComparisons.length}
              active={false}
            />
            
            <Divider my="xs" label="File Explorer" labelPosition="center" />
            
            <Accordion variant="contained" defaultValue="source">
              <FileTreeSection 
                title="Source Files" 
                files={sourceFiles}
                isLoading={loading}
              />
              
              <FileTreeSection 
                title="Target Files" 
                files={targetFiles}
                isLoading={loading}
              />
            </Accordion>
          </Stack>
        </ScrollArea>
      </Stack>
      
      <Stack mb="md">
        <Divider />
        <Text size="xs" c="dimmed" ta="center">Cursed Diff © 2024</Text>
      </Stack>
    </Stack>
  )
} 