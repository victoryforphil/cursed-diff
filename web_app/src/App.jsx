import { Routes, Route } from 'react-router-dom'
import { AppLayout } from './layout/AppLayout'
import { FileView } from './pages/FileView'
import { DiffView } from './pages/DiffView'
import { HistoryView } from './pages/HistoryView'
import '@mantine/core/styles.css';

/**
 * App - Main application component
 * 
 * Defines the application routes and overall structure
 */
function App() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<FileView />} />
        <Route path="history" element={<HistoryView />} />
        <Route path="diff/:filePathA/:filePathB" element={<DiffView />} />
      </Route>
    </Routes>
  )
}

export default App
