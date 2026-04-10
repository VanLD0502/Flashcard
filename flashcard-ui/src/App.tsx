import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import StudySetDetail from './pages/StudySetDetail';
import FlashcardStudy from './pages/FlashcardStudy';
import Quiz from './pages/Quiz';
import Login from './pages/Login';
import Register from './pages/Register';
import CreateSet from './pages/CreateSet';
import MySets from './pages/MySets';
import EditSet from './pages/EditSet';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/layout/Layout';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={ <Layout><Home /></Layout> } />
          <Route path="/create" element={ <Layout><CreateSet /></Layout> } />
          <Route path="/my-sets" element={ <Layout><MySets /></Layout> } />
          <Route path="/set/:id" element={ <Layout><StudySetDetail /></Layout> } />
          <Route path="/set/:id/edit" element={ <Layout><EditSet /></Layout> } />
          <Route path="/set/:id/study" element={ <Layout><FlashcardStudy /></Layout> } />
          <Route path="/set/:id/quiz" element={ <Layout><Quiz /></Layout> } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
