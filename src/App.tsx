import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Leagues from './pages/Leagues'
import CreateLeague from './pages/CreateLeague'
import LeagueDetail from './pages/LeagueDetail'
import Settings from './pages/Settings'
import Players from './pages/Players'

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/leagues" element={<Leagues />} />
          <Route path="/leagues/new" element={<CreateLeague />} />
          <Route path="/leagues/:id" element={<LeagueDetail />} />
          <Route path="/players" element={<Players />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
