import React, { useState, useEffect } from 'react';
import axiosInstance from '../utils/api';
import { DollarSign, ShoppingCart, AlertTriangle, Package, Download, Plus, ShoppingBag, Search, FileText, X, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [stats, setStats] = useState({ todays_sales: 0, items_sold_today: 0, low_stock_items: 0, purchase_orders: 0 });
  const [recentSales, setRecentSales] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  const [saleForm, setSaleForm] = useState({
    invoice_no: '',
    customer_name: '',
    payment_method: 'Cash'
  });
  
  const [saleCart, setSaleCart] = useState([]);
  const [searchMedicine, setSearchMedicine] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, salesRes, medicinesRes] = await Promise.all([
        axiosInstance.get('/dashboard/stats'),
        axiosInstance.get('/dashboard/recent-sales'),
        axiosInstance.get('/inventory/medicines')
      ]);
      setStats(statsRes.data);
      setRecentSales(salesRes.data);
      setMedicines(medicinesRes.data);
      setError("");
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (medicine) => {
    const existingItem = saleCart.find(item => item.id === medicine.id);
    
    if (existingItem) {
      if (existingItem.quantity < medicine.quantity) {
        setSaleCart(saleCart.map(item =>
          item.id === medicine.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      } else {
        setError(`Cannot add more ${medicine.medicine_name}. Max available: ${medicine.quantity}`);
      }
    } else {
      setSaleCart([...saleCart, { ...medicine, quantity: 1 }]);
      setError("");
    }
  };

  const handleRemoveFromCart = (medicineId) => {
    setSaleCart(saleCart.filter(item => item.id !== medicineId));
  };

  const handleUpdateCartQuantity = (medicineId, quantity) => {
    if (quantity <= 0) {
      handleRemoveFromCart(medicineId);
    } else {
      const medicine = medicines.find(m => m.id === medicineId);
      if (quantity <= medicine.quantity) {
        setSaleCart(saleCart.map(item =>
          item.id === medicineId
            ? { ...item, quantity }
            : item
        ));
      } else {
        setError(`Cannot add more. Max available: ${medicine.quantity}`);
      }
    }
  };

  const calculateTotalAmount = () => {
    return saleCart.reduce((sum, item) => sum + (item.mrp * item.quantity), 0);
  };

  const calculateTotalItems = () => {
    return saleCart.reduce((sum, item) => sum + item.quantity, 0);
  };

  const handleCreateSale = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      if (!saleForm.invoice_no.trim() || !saleForm.customer_name.trim()) {
        setError("Please enter invoice number and customer name");
        setSubmitting(false);
        return;
      }

      if (saleCart.length === 0) {
        setError("Please add at least one medicine to the cart");
        setSubmitting(false);
        return;
      }

      // Prepare items array with medicine_id and quantity
      const items = saleCart.map(item => ({
        medicine_id: item.id,
        quantity: item.quantity
      }));

      const saleData = {
        invoice_no: saleForm.invoice_no.trim(),
        customer_name: saleForm.customer_name.trim(),
        items_count: calculateTotalItems(),
        total_amount: calculateTotalAmount(),
        payment_method: saleForm.payment_method,
        items: items
      };

      await axiosInstance.post('/sales/create-sale', saleData);
      setSuccess("Sale created successfully!");
      
      setTimeout(() => {
        setSaleForm({
          invoice_no: '',
          customer_name: '',
          payment_method: 'Cash'
        });
        setSaleCart([]);
        setShowSaleModal(false);
        setSubmitting(false);
        fetchData();
      }, 1000);
    } catch (error) {
      setError(error.response?.data?.detail || "Failed to create sale");
      setSubmitting(false);
    }
  };

  const filteredMedicines = medicines.filter(m =>
    (m.medicine_name.toLowerCase().includes(searchMedicine.toLowerCase()) ||
      m.generic_name.toLowerCase().includes(searchMedicine.toLowerCase())) &&
    m.quantity > 0 && m.status !== 'Expired'
  );

  if (loading) return <div className="p-8 text-gray-500 text-center">Loading dashboard data...</div>;

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

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Pharmacy CRM</h1>
          <p className="text-sm text-gray-500 mt-1">Manage inventory, sales, and purchase orders</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm">
            <Download size={16} /> Export
          </button>
          <Link to="/inventory" className="flex items-center gap-2 px-4 py-2 bg-[#0f62fe] text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm">
            <Plus size={16} /> Add Medicine
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        {/* Sales Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-36">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-green-100 text-green-600 rounded-xl"><DollarSign size={24} /></div>
            <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-md flex items-center gap-1">
              <span className="text-[10px]">↗</span> +12.5%
            </span>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-800">₹{stats.todays_sales.toLocaleString()}</h3>
            <p className="text-xs text-gray-500 mt-1">Today's Sales</p>
          </div>
        </div>

        {/* Items Sold */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-36">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl"><ShoppingCart size={24} /></div>
            <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded-md">32 Orders</span>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-800">{stats.items_sold_today}</h3>
            <p className="text-xs text-gray-500 mt-1">Items Sold Today</p>
          </div>
        </div>

        {/* Low Stock */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-36">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-orange-100 text-orange-500 rounded-xl"><AlertTriangle size={24} /></div>
            <span className="text-xs font-semibold text-orange-700 bg-orange-100 px-2 py-1 rounded-md">Action Needed</span>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-800">{stats.low_stock_items}</h3>
            <p className="text-xs text-gray-500 mt-1">Low Stock Items</p>
          </div>
        </div>

        {/* Purchase Orders */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-36">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-fuchsia-100 text-fuchsia-600 rounded-xl"><Package size={24} /></div>
            <span className="text-xs font-semibold text-fuchsia-700 bg-fuchsia-100 px-2 py-1 rounded-md">5 Pending</span>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-800">₹{stats.purchase_orders.toLocaleString()}</h3>
            <p className="text-xs text-gray-500 mt-1">Purchase Orders</p>
          </div>
        </div>
      </div>

      {/* Tabs & Make a Sale Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
           <div className="flex gap-6 text-sm font-medium">
             <button className="flex items-center gap-2 text-gray-800 border-b-2 border-gray-800 pb-2"><ShoppingCart size={16}/> Sales</button>
             <button className="flex items-center gap-2 text-gray-400 pb-2 hover:text-gray-600"><Package size={16}/> Purchase</button>
             <button className="flex items-center gap-2 text-gray-400 pb-2 hover:text-gray-600"><FileText size={16}/> <Link to="/inventory">Inventory</Link></button>
           </div>
           <div className="flex gap-3">
             <button 
               onClick={() => setShowSaleModal(true)}
               className="flex items-center gap-2 px-4 py-2 bg-[#0f62fe] text-white rounded-lg text-sm font-medium shadow-sm hover:bg-blue-700">
               <Plus size={16}/> New Sale
             </button>
             <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium shadow-sm hover:bg-gray-50"><Plus size={16}/> New Purchase</button>
           </div>
        </div>

        {/* Light Blue Sale Box */}
        <div className="bg-[#f0f8ff] rounded-2xl p-6 border border-blue-50">
          <h2 className="text-gray-800 font-semibold mb-1">Make a Sale</h2>
          <p className="text-xs text-gray-500 mb-4">Select medicines from inventory</p>
          
          <div className="flex gap-4 items-center mb-6">
            <input type="text" placeholder="Patient Id" className="px-4 py-2.5 rounded-lg border border-gray-200 w-64 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100" />
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 text-gray-400" size={16} />
              <input type="text" placeholder="Search medicines..." className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100" />
            </div>
            <button 
              onClick={() => setShowSaleModal(true)}
              className="px-6 py-2.5 bg-[#3b82f6] hover:bg-blue-600 text-white rounded-lg text-sm font-medium shadow-sm">
              Enter
            </button>
            <button className="px-8 py-2.5 bg-[#ea4335] hover:bg-red-600 text-white rounded-lg text-sm font-medium shadow-sm ml-auto">Bill</button>
          </div>

          <div className="grid grid-cols-8 gap-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider pb-2 border-b border-blue-100">
            <div className="col-span-1">Medicine Name</div>
            <div className="col-span-1">Generic Name</div>
            <div className="col-span-1">Batch No</div>
            <div className="col-span-1">Expiry Date</div>
            <div className="col-span-1">Quantity</div>
            <div className="col-span-1">MRP / Price</div>
            <div className="col-span-1">Supplier</div>
            <div className="col-span-1">Status & Actions</div>
          </div>
        </div>
      </div>

      {/* Recent Sales List */}
      <div>
        <h2 className="text-sm font-semibold text-gray-800 mb-4">Recent Sales</h2>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {recentSales.length > 0 ? (
            recentSales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between p-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-[#10b981] text-white rounded-xl shadow-sm">
                    <ShoppingCart size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{sale.invoice_no}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{sale.customer_name} • {sale.items_count} items • {sale.payment_method}</p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-6">
                  <div>
                    <p className="text-sm font-bold text-gray-800">₹{sale.total_amount}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(sale.date).toISOString().split('T')[0]}</p>
                  </div>
                  <span className="text-[10px] font-medium text-green-700 bg-green-100 px-3 py-1.5 rounded-md border border-green-200">
                    {sale.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500 text-sm">No recent sales found in the database.</div>
          )}
        </div>
      </div>

      {/* Sale Modal */}
      {showSaleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h2 className="text-xl font-semibold text-gray-800">Create New Sale</h2>
              <button 
                onClick={() => {
                  setShowSaleModal(false);
                  setError("");
                  setSuccess("");
                }}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSale} className="p-6 space-y-6">
              {/* Sale Header */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Invoice No *</label>
                  <input
                    type="text"
                    value={saleForm.invoice_no}
                    onChange={(e) => setSaleForm({ ...saleForm, invoice_no: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="INV-001"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
                  <input
                    type="text"
                    value={saleForm.customer_name}
                    onChange={(e) => setSaleForm({ ...saleForm, customer_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter customer name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                  <select
                    value={saleForm.payment_method}
                    onChange={(e) => setSaleForm({ ...saleForm, payment_method: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="UPI">UPI</option>
                  </select>
                </div>
              </div>

              {/* Add Medicine */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Add Medicines to Sale</label>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-3 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search medicines..."
                    value={searchMedicine}
                    onChange={(e) => setSearchMedicine(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Available Medicines */}
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                  {filteredMedicines.length > 0 ? (
                    <div className="space-y-1">
                      {filteredMedicines.map((med) => (
                        <button
                          key={med.id}
                          type="button"
                          onClick={() => handleAddToCart(med)}
                          className="w-full text-left px-4 py-2 hover:bg-blue-50 border-b border-gray-100 last:border-0 transition-colors"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm font-medium text-gray-800">{med.medicine_name}</p>
                              <p className="text-xs text-gray-500">{med.generic_name} • Qty: {med.quantity}</p>
                            </div>
                            <p className="text-sm font-semibold text-gray-800">₹{med.mrp}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-gray-500 text-sm">No medicines available</div>
                  )}
                </div>
              </div>

              {/* Cart */}
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Sale Items ({saleCart.length})</h3>
                {saleCart.length > 0 ? (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="p-3 text-left font-medium text-gray-700">Medicine</th>
                          <th className="p-3 text-left font-medium text-gray-700">Price</th>
                          <th className="p-3 text-left font-medium text-gray-700">Qty</th>
                          <th className="p-3 text-left font-medium text-gray-700">Total</th>
                          <th className="p-3 text-center font-medium text-gray-700">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {saleCart.map((item) => (
                          <tr key={item.id} className="border-b border-gray-100 last:border-0">
                            <td className="p-3 text-gray-800">{item.medicine_name}</td>
                            <td className="p-3 text-gray-600">₹{item.mrp}</td>
                            <td className="p-3">
                              <input
                                type="number"
                                min="1"
                                max={item.quantity}
                                value={item.quantity}
                                onChange={(e) => handleUpdateCartQuantity(item.id, parseInt(e.target.value))}
                                className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </td>
                            <td className="p-3 font-semibold text-gray-800">₹{(item.mrp * item.quantity).toFixed(2)}</td>
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveFromCart(item.id)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="bg-gray-50 p-3 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-800">Total Amount:</span>
                        <span className="text-2xl font-bold text-green-600">₹{calculateTotalAmount().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500 border border-gray-200 rounded-lg">
                    No medicines added to cart yet
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowSaleModal(false);
                    setError("");
                    setSuccess("");
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saleCart.length === 0 || submitting}
                  className="px-6 py-2 bg-[#0f62fe] text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <span className="inline-block animate-spin">⏳</span>
                      Completing...
                    </>
                  ) : (
                    'Complete Sale'
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

export default Dashboard;