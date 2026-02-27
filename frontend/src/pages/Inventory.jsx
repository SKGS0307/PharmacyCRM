import React, { useState, useEffect } from 'react';
import axiosInstance from '../utils/api';
import { Filter, Download, Box, CheckCircle2, AlertTriangle, DollarSign, Plus, Edit2, Trash2, X } from 'lucide-react';

const Inventory = () => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    medicine_name: '',
    generic_name: '',
    category: '',
    batch_no: '',
    expiry_date: '',
    quantity: '',
    cost_price: '',
    mrp: '',
    supplier: '',
    status: 'Active'
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/inventory/medicines');
      setMedicines(res.data);
      setError("");
    } catch (error) {
      console.error("Error fetching inventory:", error);
      setError("Failed to load inventory. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (medicine = null) => {
    if (medicine) {
      setEditingId(medicine.id);
      setFormData(medicine);
    } else {
      setEditingId(null);
      setFormData({
        medicine_name: '',
        generic_name: '',
        category: '',
        batch_no: '',
        expiry_date: '',
        quantity: '',
        cost_price: '',
        mrp: '',
        supplier: '',
        status: 'Active'
      });
    }
    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setError("");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      // Validation
      if (!formData.medicine_name?.trim() || !formData.generic_name?.trim() || !formData.supplier?.trim()) {
        setError("Please fill in all required fields");
        setSubmitting(false);
        return;
      }

      const costPrice = parseFloat(formData.cost_price);
      const mrp = parseFloat(formData.mrp);

      if (costPrice <= 0 || mrp <= 0) {
        setError("Prices must be greater than 0");
        setSubmitting(false);
        return;
      }

      if (mrp < costPrice) {
        setError("MRP must be greater than or equal to cost price");
        setSubmitting(false);
        return;
      }

      const payload = {
        medicine_name: formData.medicine_name.trim(),
        generic_name: formData.generic_name.trim(),
        category: formData.category.trim(),
        batch_no: formData.batch_no.trim(),
        expiry_date: formData.expiry_date,
        quantity: parseInt(formData.quantity) || 0,
        cost_price: costPrice,
        mrp: mrp,
        supplier: formData.supplier.trim()
      };

      if (editingId) {
        await axiosInstance.put(`/inventory/medicines/${editingId}`, payload);
        setSuccess("Medicine updated successfully");
      } else {
        await axiosInstance.post('/inventory/medicines', payload);
        setSuccess("Medicine added successfully");
      }

      setTimeout(() => {
        fetchInventory();
        handleCloseModal();
        setSubmitting(false);
      }, 500);
    } catch (error) {
      setError(error.response?.data?.detail || "An error occurred");
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this medicine? This action cannot be undone.")) {
      try {
        await axiosInstance.delete(`/inventory/medicines/${id}`);
        setSuccess("Medicine deleted successfully");
        fetchInventory();
      } catch (error) {
        setError(error.response?.data?.detail || "Failed to delete medicine");
      }
    }
  };

  const handleFilterToggle = () => {
    setShowFilterMenu(!showFilterMenu);
  };

  const handleFilterChange = (status) => {
    setSelectedFilters((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  // Compute stats dynamically from the actual fetched backend data
  const totalItems = medicines.length;
  const activeStock = medicines.filter(m => m.status === 'Active').length;
  const lowStock = medicines.filter(m => m.status === 'Low Stock').length;
  const totalValue = medicines.reduce((sum, item) => sum + (item.quantity * item.cost_price), 0);

  // Filter functionality - now includes status filter
  const filteredMedicines = medicines.filter(m => {
    const matchesSearch = m.medicine_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         m.generic_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = selectedFilters.length === 0 || selectedFilters.includes(m.status);
    
    return matchesSearch && matchesFilter;
  });

  // Status Badge styling logic
  const getStatusStyle = (status) => {
    switch (status) {
      case 'Active': return 'text-green-700 bg-green-100 border-green-200';
      case 'Low Stock': return 'text-orange-700 bg-orange-100 border-orange-200';
      case 'Expired': return 'text-red-700 bg-red-100 border-red-200';
      case 'Out of Stock': return 'text-gray-600 bg-gray-100 border-gray-200';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) return <div className="p-8 text-gray-500 text-center">Loading inventory data...</div>;

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError("")} className="text-red-700 hover:text-red-900">✕</button>
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex justify-between items-center">
          <span>{success}</span>
          <button onClick={() => setSuccess("")} className="text-green-700 hover:text-green-900">✕</button>
        </div>
      )}

      {/* Light Teal Inventory Overview Section */}
      <div className="bg-[#f0fdf4] p-6 rounded-2xl mb-8 border border-green-50">
        <h2 className="text-sm font-semibold text-gray-800 mb-4">Inventory Overview</h2>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-green-50 shadow-sm flex flex-col justify-between h-24">
            <div className="flex justify-between items-center text-gray-500 text-xs">
              <span>Total Items</span> <Box size={14} className="text-blue-500" />
            </div>
            <span className="text-2xl font-semibold text-gray-800">{totalItems}</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-green-50 shadow-sm flex flex-col justify-between h-24">
            <div className="flex justify-between items-center text-gray-500 text-xs">
              <span>Active Stock</span> <CheckCircle2 size={14} className="text-green-500" />
            </div>
            <span className="text-2xl font-semibold text-gray-800">{activeStock}</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-green-50 shadow-sm flex flex-col justify-between h-24">
            <div className="flex justify-between items-center text-gray-500 text-xs">
              <span>Low Stock</span> <AlertTriangle size={14} className="text-orange-500" />
            </div>
            <span className="text-2xl font-semibold text-gray-800">{lowStock}</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-green-50 shadow-sm flex flex-col justify-between h-24">
            <div className="flex justify-between items-center text-gray-500 text-xs">
              <span>Total Value</span> <DollarSign size={14} className="text-purple-500" />
            </div>
            <span className="text-2xl font-semibold text-gray-800">₹{totalValue.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Complete Inventory Header & Controls */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-semibold text-gray-800">Complete Inventory</h2>
        <div className="flex gap-3 relative">
          <input 
            type="text" 
            placeholder="Search..." 
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="relative">
            <button 
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-sm font-medium shadow-sm transition-colors ${
                selectedFilters.length > 0 
                  ? 'bg-blue-50 border-blue-300 text-blue-600 hover:bg-blue-100' 
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Filter size={14} /> Filter
              {selectedFilters.length > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full font-semibold">
                  {selectedFilters.length}
                </span>
              )}
            </button>
            
            {/* Filter Dropdown Menu */}
            {showFilterMenu && (
              <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 w-48">
                <div className="p-3 border-b border-gray-100 flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-800">Filter by Status</span>
                  {selectedFilters.length > 0 && (
                    <button 
                      onClick={() => setSelectedFilters([])}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Clear All
                    </button>
                  )}
                </div>
                <div className="p-2 space-y-1">
                  {['Active', 'Low Stock', 'Expired', 'Out of Stock'].map((status) => (
                    <label key={status} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedFilters.includes(status)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedFilters([...selectedFilters, status]);
                          } else {
                            setSelectedFilters(selectedFilters.filter(f => f !== status));
                          }
                        }}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="text-sm text-gray-700">{status}</span>
                      <span className="ml-auto text-xs text-gray-500">
                        ({medicines.filter(m => m.status === status).length})
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm">
            <Download size={14} /> Export
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-1.5 bg-[#0f62fe] text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm"
          >
            <Plus size={14} /> Add Medicine
          </button>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 sticky top-0">
            <tr>
              <th className="p-4 whitespace-nowrap">Medicine Name</th>
              <th className="p-4 whitespace-nowrap">Generic Name</th>
              <th className="p-4 whitespace-nowrap">Category</th>
              <th className="p-4 whitespace-nowrap">Batch No</th>
              <th className="p-4 whitespace-nowrap">Expiry Date</th>
              <th className="p-4 whitespace-nowrap">Quantity</th>
              <th className="p-4 whitespace-nowrap">Cost Price</th>
              <th className="p-4 whitespace-nowrap">MRP</th>
              <th className="p-4 whitespace-nowrap">Supplier</th>
              <th className="p-4 whitespace-nowrap">Status</th>
              <th className="p-4 whitespace-nowrap text-center min-w-[100px]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredMedicines.length > 0 ? (
              filteredMedicines.map((med) => (
                <tr key={med.id} className="hover:bg-gray-50 transition-colors text-gray-700">
                  <td className="p-4 font-medium whitespace-nowrap">{med.medicine_name}</td>
                  <td className="p-4 text-gray-500 whitespace-nowrap">{med.generic_name}</td>
                  <td className="p-4 whitespace-nowrap">{med.category}</td>
                  <td className="p-4 text-gray-500 whitespace-nowrap">{med.batch_no}</td>
                  <td className="p-4 whitespace-nowrap">{med.expiry_date}</td>
                  <td className={`p-4 font-semibold whitespace-nowrap ${med.quantity < 50 ? 'text-orange-600' : med.quantity === 0 ? 'text-red-600' : 'text-gray-800'}`}>
                    {med.quantity}
                  </td>
                  <td className="p-4 whitespace-nowrap">₹{med.cost_price.toFixed(2)}</td>
                  <td className="p-4 whitespace-nowrap">₹{med.mrp.toFixed(2)}</td>
                  <td className="p-4 text-gray-500 whitespace-nowrap">{med.supplier}</td>
                  <td className="p-4 whitespace-nowrap">
                    <span className={`text-[10px] font-medium px-2.5 py-1 rounded-md border inline-block ${getStatusStyle(med.status)}`}>
                      {med.status}
                    </span>
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    <div className="flex gap-3 justify-center items-center">
                      <button 
                        onClick={() => handleOpenModal(med)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(med.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="11" className="p-8 text-center text-gray-400">No inventory found matching your criteria.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Medicine Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h2 className="text-xl font-semibold text-gray-800">
                {editingId ? 'Edit Medicine' : 'Add New Medicine'}
              </h2>
              <button 
                onClick={handleCloseModal}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Medicine Name *</label>
                  <input
                    type="text"
                    name="medicine_name"
                    value={formData.medicine_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Generic Name *</label>
                  <input
                    type="text"
                    name="generic_name"
                    value={formData.generic_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Batch No</label>
                  <input
                    type="text"
                    name="batch_no"
                    value={formData.batch_no}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    name="expiry_date"
                    value={formData.expiry_date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    name="cost_price"
                    value={formData.cost_price}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">MRP (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    name="mrp"
                    value={formData.mrp}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier *</label>
                  <input
                    type="text"
                    name="supplier"
                    value={formData.supplier}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#0f62fe] text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <span className="inline-block animate-spin">⏳</span>
                      {editingId ? 'Updating...' : 'Adding...'}
                    </>
                  ) : (
                    editingId ? 'Update Medicine' : 'Add Medicine'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;