import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutGrid, Package, Search, Calendar, Users, Settings, Plus, Stethoscope, Activity } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';

// The Sidebar Component (Matching the left side of your UI images)
const Sidebar = () => {
  return (
    <div className="w-20 bg-white h-screen border-r border-gray-200 flex flex-col items-center py-6 gap-8 fixed left-0 top-0">
      <div className="p-2 bg-gray-100 rounded-xl cursor-pointer"><Search size={24} className="text-gray-600"/></div>
      <div className="flex flex-col gap-6 w-full items-center text-gray-400">
        <Link to="/" className="p-2 hover:bg-blue-50 hover:text-blue-600 rounded-xl"><LayoutGrid size={24} /></Link>
        <Link to="/inventory" className="p-2 hover:bg-blue-50 hover:text-blue-600 rounded-xl"><Activity size={24} /></Link>
        <div className="p-2 hover:bg-gray-100 rounded-xl cursor-pointer"><Calendar size={24} /></div>
        <div className="p-2 hover:bg-gray-100 rounded-xl cursor-pointer"><Users size={24} /></div>
        <div className="p-2 hover:bg-gray-100 rounded-xl cursor-pointer"><Stethoscope size={24} /></div>
        <div className="p-2 hover:bg-gray-100 rounded-xl cursor-pointer"><Package size={24} /></div>
        <div className="p-2 hover:bg-gray-100 rounded-xl cursor-pointer"><Plus size={24} /></div>
      </div>
      <div className="mt-auto p-2 hover:bg-gray-100 rounded-xl cursor-pointer">
        <Settings size={24} className="text-gray-400"/>
      </div>
    </div>
  );
};

// Main App Component
function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-gray-50 font-sans">
        <Sidebar />
        <div className="ml-20 flex-1 p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inventory" element={<Inventory />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;