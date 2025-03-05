import React from 'react';
import { 
  Container, 
  Title, 
  Text, 
  Stack, 
  Group, 
  Box,
  SimpleGrid,
  Tabs,
  Alert,
  Button
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { RecentComparisons, FileSummary } from '../components/patched';
import { useComparisonHistory } from '../hooks';
import { IconInfoCircle, IconHistory, IconStar } from '@tabler/icons-react';

/**
 * HistoryView - Page component for displaying comparison history
 * 
 * Shows recent comparisons and allows users to manage their history
 */
export function HistoryView() {
  const navigate = useNavigate();
  const { 
    recentComparisons, 
    starredComparisons, 
    deleteComparison, 
    toggleStarred,
    isStarred
  } = useComparisonHistory();
  
  // Handle opening a comparison
  const handleOpenComparison = (comparison) => {
    // Create URL-safe paths
    const sourcePathEncoded = encodeURIComponent(comparison.sourceFile);
    const targetPathEncoded = encodeURIComponent(comparison.targetFile);
    
    // Navigate to the diff view
    navigate(`/diff/${sourcePathEncoded}/${targetPathEncoded}`);
  };
  
  // Handle toggle star status
  const handleToggleStar = (id) => {
    const comparison = recentComparisons.find(c => c.id === id) || 
                      starredComparisons.find(c => c.id === id);
    if (comparison) {
      toggleStarred(comparison);
    }
  };
  
  return (
    <Container size="xl" p="md">
      <Stack spacing="lg">
        <Box>
          <Title order={2} mb="md">Comparison History</Title>
          <Text color="dimmed" mb="lg">
            View and manage your comparison history
          </Text>
        </Box>
        
        {recentComparisons.length === 0 && starredComparisons.length === 0 ? (
          <Alert icon={<IconInfoCircle size={16} />} title="No comparisons yet" color="blue">
            Your comparison history will appear here once you start comparing files.
            <Button 
              variant="light" 
              color="blue" 
              fullWidth 
              mt="md" 
              onClick={() => navigate('/')}
            >
              Go to File Selection
            </Button>
          </Alert>
        ) : (
          <Tabs defaultValue="recent">
            <Tabs.List mb="md">
              <Tabs.Tab value="recent" leftSection={<IconHistory size={16} />}>
                Recent
              </Tabs.Tab>
              <Tabs.Tab 
                value="starred" 
                leftSection={<IconStar size={16} />}
                rightSection={starredComparisons.length > 0 ? 
                  <Text size="xs" fw={700} c="blue" bg="blue.0" py={4} px={8} style={{borderRadius: 4}}>
                    {starredComparisons.length}
                  </Text> : null
                }
              >
                Starred
              </Tabs.Tab>
            </Tabs.List>
            
            <Tabs.Panel value="recent">
              <Stack>
                {recentComparisons.map(comparison => (
                  <FileSummary
                    key={comparison.id}
                    id={comparison.id}
                    sourceFile={comparison.sourceFile}
                    targetFile={comparison.targetFile}
                    stats={comparison.stats}
                    date={comparison.formattedDate}
                    isStarred={isStarred(comparison.id)}
                    onToggleStar={handleToggleStar}
                    onOpen={() => handleOpenComparison(comparison)}
                    onDelete={() => deleteComparison(comparison.id)}
                  />
                ))}
              </Stack>
            </Tabs.Panel>
            
            <Tabs.Panel value="starred">
              {starredComparisons.length > 0 ? (
                <Stack>
                  {starredComparisons.map(comparison => (
                    <FileSummary
                      key={comparison.id}
                      id={comparison.id}
                      sourceFile={comparison.sourceFile}
                      targetFile={comparison.targetFile}
                      stats={comparison.stats}
                      date={comparison.formattedDate}
                      isStarred={true}
                      onToggleStar={handleToggleStar}
                      onOpen={() => handleOpenComparison(comparison)}
                      onDelete={() => deleteComparison(comparison.id)}
                    />
                  ))}
                </Stack>
              ) : (
                <Alert icon={<IconInfoCircle size={16} />} title="No starred comparisons" color="yellow">
                  Star important comparisons to find them quickly later.
                </Alert>
              )}
            </Tabs.Panel>
          </Tabs>
        )}
      </Stack>
    </Container>
  );
} 