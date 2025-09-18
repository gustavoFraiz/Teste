import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import EnqueteList from './EnqueteList';
import EnqueteDetail from './EnqueteDetail';
import EnqueteForm from './EnqueteForm'; 

function App() {
  return (
    <Router>
      <header className="app-header">
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <h1>Sistema de Votação</h1>
        </Link>
      </header>
      <main className="container">
        <Routes>
          <Route path="/" element={<EnqueteList />} />
          <Route path="/enquete/:id" element={<EnqueteDetail />} />
          <Route path="/criar-enquete" element={<EnqueteForm />} />
          <Route path="/enquete/:id/editar" element={<EnqueteForm />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
