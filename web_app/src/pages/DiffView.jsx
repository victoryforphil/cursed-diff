import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactDiffViewer from 'react-diff-viewer';
import { 
  Box, 
  Paper, 
  Title, 
  Group, 
  Badge, 
  Loader, 
  Center, 
  Text,
  ActionIcon,
  Stack
} from '@mantine/core';
import { IconArrowLeft, IconFileCode, IconPlus, IconMinus, IconEqual } from '@tabler/icons-react';

// Minimal styling for the diff viewer
const diffViewerStyles = `
  /* Reset all styles to avoid conflicts */
  .react-diff-viewer * {
    box-sizing: border-box;
  }
  
  /* Force equal width columns */
  .react-diff-viewer-split {
    display: grid !important;
    grid-template-columns: 50% 50% !important;
  }
`;

export function DiffView() {
  const { filePathA, filePathB } = useParams();
  const navigate = useNavigate();
  
  const [fileA, setFileA] = useState(null);
  const [fileB, setFileB] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Get file extension for syntax highlighting
  const getFileExtension = (filePath) => {
    if (!filePath) return '';
    const parts = filePath.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  };
  
  // Get file name from path
  const getFileName = (filePath) => {
    if (!filePath) return '';
    return filePath.split('/').pop();
  };
  
  const fileExtension = getFileExtension(filePathA || filePathB);
  const fileName = getFileName(filePathA || filePathB);
  
  // Inject custom styles
  useEffect(() => {
    // Add styles to head
    const styleElement = document.createElement('style');
    styleElement.innerHTML = diffViewerStyles;
    document.head.appendChild(styleElement);
    
    // Clean up on unmount
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);
  
  // Fetch file contents from the backend
  useEffect(() => {
    const fetchFiles = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Find the file indexes in both directories
        const [filesA, filesB] = await Promise.all([
          fetch('http://localhost:3000/api/files/a').then(res => res.json()),
          fetch('http://localhost:3000/api/files/b').then(res => res.json())
        ]);
        
        // Find matching files by path
        const fileAIndex = filesA.findIndex(file => file.path === filePathA);
        const fileBIndex = filesB.findIndex(file => file.path === filePathB);
        
        // If files exist, fetch their contents
        const fileAContents = fileAIndex !== -1 
          ? await fetch(`http://localhost:3000/api/files/a/${fileAIndex}/contents`).then(res => res.json())
          : { contents: '', name: '', path: '' };
          
        const fileBContents = fileBIndex !== -1 
          ? await fetch(`http://localhost:3000/api/files/b/${fileBIndex}/contents`).then(res => res.json())
          : { contents: '', name: '', path: '' };
          
        setFileA(fileAContents);
        setFileB(fileBContents);
      } catch (err) {
        console.error('Error fetching file contents:', err);
        setError(`Failed to fetch file contents: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFiles();
  }, [filePathA, filePathB]);
  
  // Handle back button click
  const handleBack = () => {
    navigate('/');
  };
  
  // Get the status of the file
  const getFileStatus = () => {
    if (!fileA?.contents && fileB?.contents) return 'added';
    if (fileA?.contents && !fileB?.contents) return 'removed';
    if (fileA?.contents && fileB?.contents && fileA.contents !== fileB.contents) return 'modified';
    return 'unchanged';
  };
  
  const fileStatus = getFileStatus();
  
  // Render file status badge
  const renderStatusBadge = () => {
    switch(fileStatus) {
      case 'added':
        return <Badge color="green">Added</Badge>;
      case 'removed':
        return <Badge color="red">Removed</Badge>;
      case 'modified':
        return <Badge color="orange">Modified</Badge>;
      default:
        return <Badge color="blue">Unchanged</Badge>;
    }
  };
  
  // Calculate diff statistics
  const calculateDiffStats = () => {
    if (!fileA?.contents && !fileB?.contents) return { added: 0, removed: 0, unchanged: 0 };
    
    const aLines = fileA?.contents ? fileA.contents.split('\n').length : 0;
    const bLines = fileB?.contents ? fileB.contents.split('\n').length : 0;
    
    const added = !fileA?.contents ? bLines : 
                  (fileA?.contents === fileB?.contents) ? 0 : 
                  Math.max(0, bLines - aLines);
                  
    const removed = !fileB?.contents ? aLines :
                    (fileA?.contents === fileB?.contents) ? 0 :
                    Math.max(0, aLines - bLines);
    
    const unchanged = fileA?.contents && fileB?.contents ? 
                      (fileA.contents === fileB.contents ? aLines : 
                      Math.min(aLines, bLines) - Math.abs(aLines - bLines)/2) : 0;
    
    return {
      added,
      removed,
      unchanged: Math.round(unchanged)
    };
  };
  
  const diffStats = calculateDiffStats();
  
  // Simple dark theme for the diff viewer
  const darkTheme = {
    variables: {
      dark: {
        diffViewerBackground: '#1a1b1e',
        diffViewerColor: '#FFF',
        addedBackground: '#044B53',
        addedColor: '#FFF',
        removedBackground: '#632F34',
        removedColor: '#FFF',
        gutterBackground: '#2c2f3a',
        gutterColor: '#8c8c8c'
      }
    }
  };
  
  return (
    <Box p="md" style={{ height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
      <Paper withBorder p="md" mb="md" style={{ 
        backgroundColor: '#25262b', 
        borderColor: '#444'
      }}>
        <Group position="apart">
          <Group>
            <ActionIcon 
              size="lg" 
              variant="light" 
              color="blue" 
              onClick={handleBack}
            >
              <IconArrowLeft size={18} />
            </ActionIcon>
            <Group spacing="xs">
              <IconFileCode size={22} style={{ color: '#607d8b' }}/>
              <Title order={3}>{fileName}</Title>
              {renderStatusBadge()}
            </Group>
          </Group>
          
          <Group>
            <Badge size="lg" variant="outline">File Diff</Badge>
          </Group>
        </Group>
      </Paper>
      
      {error && (
        <Paper withBorder p="md" mb="md" style={{ backgroundColor: 'rgba(244, 67, 54, 0.1)', borderColor: '#f44336' }}>
          <Text color="red">{error}</Text>
        </Paper>
      )}
      
      {/* Statistics Panel */}
      {!loading && !error && (
        <Paper withBorder p="md" mb="md" style={{ 
          backgroundColor: '#25262b', 
          borderColor: '#444'
        }}>
          <Group position="apart">
            <Group spacing="xl">
              <Group spacing="xs">
                <IconPlus size={16} style={{ color: '#4caf50' }} />
                <Text>{diffStats.added} lines added</Text>
              </Group>
              <Group spacing="xs">
                <IconMinus size={16} style={{ color: '#f44336' }} />
                <Text>{diffStats.removed} lines removed</Text>
              </Group>
              <Group spacing="xs">
                <IconEqual size={16} style={{ color: '#90caf9' }} />
                <Text>{diffStats.unchanged} lines unchanged</Text>
              </Group>
            </Group>
            
            <Group>
              <Text size="sm" color="dimmed">
                From {fileA?.path ? fileA.path : 'Folder A'} → {fileB?.path ? fileB.path : 'Folder B'}
              </Text>
            </Group>
          </Group>
        </Paper>
      )}
      
      <Paper p="md" withBorder radius="md" style={{ 
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        borderColor: '#444',
        backgroundColor: '#25262b'
      }}>
        {loading ? (
          <Center style={{ height: '100%' }}>
            <Stack align="center" spacing="sm">
              <Loader color="blue" size="xl" />
              <Text size="sm" color="dimmed">Loading file contents...</Text>
            </Stack>
          </Center>
        ) : (
          <Box style={{ 
            height: '100%', 
            overflow: 'hidden',
            position: 'relative'
          }}>
            <ReactDiffViewer
              oldValue={fileA?.contents || ''}
              newValue={fileB?.contents || ''}
              splitView={true}
              useDarkTheme={true}
              styles={darkTheme}
              showDiffOnly={false}
              leftTitle={filePathA || 'File not found in Folder A'}
              rightTitle={filePathB || 'File not found in Folder B'}
              extraLinesSurroundingDiff={5}
              compareMethod="diffLines"
            />
          </Box>
        )}
      </Paper>
    </Box>
  );
}

export default DiffView; 