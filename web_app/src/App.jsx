import { Routes, Route } from 'react-router-dom'
import { AppLayout } from './layout/AppLayout'
import { FileView } from './pages/FileView'
import { DiffView } from './pages/DiffView'
import '@mantine/core/styles.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<FileView />} />
        <Route path="diff/:filePathA/:filePathB" element={<DiffView />} />
      </Route>
    </Routes>
  )
}

export default App
