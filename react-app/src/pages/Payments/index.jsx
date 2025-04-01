import React, { useState, useEffect } from "react";
import { FaMoneyBillWave, FaTrash, FaEdit, FaPlus } from "react-icons/fa";

const Payments = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");
  const [filterType, setFilterType] = useState("all");
  const [filterMonth, setFilterMonth] = useState("all");
  const [payments, setPayments] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPayment, setCurrentPayment] = useState(null);
  const [formData, setFormData] = useState({
    memberId: "",
    amount: "",
    date: new Date().toISOString().split('T')[0],
    type: "Annual",
    expiry: ""
  });

  // Fetch payments and members from IPC API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [paymentsResponse, membersResponse] = await Promise.all([
          window.paymentsAPI.getPayments(),
          window.membersAPI.getMembers()
        ]);

        if (paymentsResponse.success && Array.isArray(paymentsResponse.payments)) {
          setPayments(paymentsResponse.payments);
        } else {
          throw new Error("Invalid payments response format");
        }

        if (membersResponse.success && Array.isArray(membersResponse.members)) {
          setMembers(membersResponse.members);
        } else {
          throw new Error("Invalid members response format");
        }
      } catch (error) {
        setError("Failed to fetch data");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Open modal for adding new payment
  const openAddModal = () => {
    setCurrentPayment(null);
    setFormData({
      memberId: "",
      amount: "",
      date: new Date().toISOString().split('T')[0],
      type: "Annual",
      expiry: ""
    });
    setIsModalOpen(true);
  };

  // Open modal for editing payment
  const openEditModal = (payment) => {
    setCurrentPayment(payment);
    setFormData({
      memberId: payment.memberId,
      amount: payment.amount,
      date: payment.date.split('T')[0],
      type: payment.type,
      expiry: payment.expiry.split('T')[0]
    });
    setIsModalOpen(true);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentPayment) {
        // Update existing payment
        await window.paymentsAPI.updatePayment(currentPayment.id, formData);
        alert("Payment updated successfully!");
      } else {
        // Add new payment
        await window.paymentsAPI.addPayment(formData);
        alert("Payment added successfully!");
      }
      setIsModalOpen(false);
      fetchPayments(); // Refresh the list
    } catch (error) {
      console.error("Error saving payment:", error);
      alert(`Failed to save payment: ${error.message}`);
    }
  };

  // Fetch payments separately
  const fetchPayments = async () => {
    try {
      const response = await window.paymentsAPI.getPayments();
      if (response.success) {
        setPayments(response.payments);
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
    }
  };

  // Delete a payment using IPC API
  const handleDeletePayment = async (paymentId) => {
    if (window.confirm("Are you sure you want to delete this payment?")) {
      try {
        const response = await window.paymentsAPI.deletePayment(paymentId);
        if (response.success) {
          setPayments(prev => prev.filter(payment => payment.id !== paymentId));
          alert("Payment deleted successfully!");
        } else {
          throw new Error(response.message || "Failed to delete payment");
        }
      } catch (error) {
        console.error("Error deleting payment:", error);
        alert("Failed to delete payment. Please try again.");
      }
    }
  };

  // Get member name by ID
  const getMemberName = (memberId) => {
    const member = members.find(m => m.id === memberId);
    return member ? `${member.firstName} ${member.lastName}` : 'Unknown Member';
  };

  // Filter and sort payments
  const filteredPayments = payments
    .filter((payment) => {
      const memberName = getMemberName(payment.memberId).toLowerCase();
      const matchesSearchTerm = memberName.includes(searchTerm.toLowerCase());

      const matchesType =
        filterType === "all" || payment.type.toLowerCase() === filterType.toLowerCase();

      const paymentMonth = new Date(payment.date).toLocaleString("default", {
        month: "short",
      });
      const matchesMonth =
        filterMonth === "all" ||
        paymentMonth.toLowerCase() === filterMonth.toLowerCase();

      return matchesSearchTerm && matchesType && matchesMonth;
    })
    .sort((a, b) =>
      sortOrder === "desc"
        ? new Date(b.date) - new Date(a.date)
        : new Date(a.date) - new Date(b.date)
    );

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPayments = filteredPayments.slice(indexOfFirstItem, indexOfLastItem);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-8 h-8 border-4 border-gray-300 border-t-maroon rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen text-red-600">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col items-center py-10">
      <div className="w-full max-w-7xl px-10">
        <h1 className="text-5xl font-extrabold text-maroon text-center mb-6">
          Payments
        </h1>
        <div className="flex justify-between items-center mb-6 p-4 bg-white shadow-lg rounded-lg">
          <StatCard
            title="Total Payments"
            value={filteredPayments.length}
            icon={FaMoneyBillWave}
            color="bg-blue-100 text-white"
          />
          <div className="flex gap-4">
            <select
              className="p-3 border rounded-lg shadow-sm text-lg"
              onChange={(e) => setSortOrder(e.target.value)}
              value={sortOrder}
            >
              <option value="desc">Most Recent</option>
              <option value="asc">Oldest First</option>
            </select>
            <select
              className="p-3 border rounded-lg shadow-sm text-lg"
              onChange={(e) => setFilterType(e.target.value)}
              value={filterType}
            >
              <option value="all">All Types</option>
              <option value="Annual">Annual</option>
              <option value="Monthly">Monthly</option>
              <option value="Walk-in">Walk-in</option>
            </select>
            <input
              type="text"
              placeholder="Search by member name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="p-3 border rounded-lg shadow-sm text-lg"
            />
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-6 py-3 bg-maroon text-white rounded-lg hover:bg-maroon-dark transition"
          >
            <FaPlus /> Add Payment
          </button>
        </div>

        <div className="bg-white p-8 w-full rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-maroon text-center mb-6">
            Recent Payments
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse rounded-lg shadow-md text-gray-700">
              <thead>
                <tr className="bg-maroon text-white">
                  <th className="px-6 py-4 text-left">Date</th>
                  <th className="px-6 py-4 text-left">Member</th>
                  <th className="px-6 py-4 text-left">Amount (₱)</th>
                  <th className="px-6 py-4 text-left">Payment Type</th>
                  <th className="px-6 py-4 text-left">Expiry Date</th>
                  <th className="px-6 py-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentPayments.map((payment, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-200 hover:bg-gray-100 transition"
                  >
                    <td className="px-6 py-4">
                      {new Date(payment.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">{getMemberName(payment.memberId)}</td>
                    <td className="px-6 py-4">₱{payment.amount.toFixed(2)}</td>
                    <td className="px-6 py-4">{payment.type}</td>
                    <td className="px-6 py-4">
                      {new Date(payment.expiry).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 flex gap-4">
                      <button
                        onClick={() => openEditModal(payment)}
                        className="text-blue-600 hover:text-blue-800 transition"
                      >
                        <FaEdit className="text-xl" />
                      </button>
                      <button
                        onClick={() => handleDeletePayment(payment.id)}
                        className="text-red-600 hover:text-red-800 transition"
                      >
                        <FaTrash className="text-xl" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex justify-center items-center mt-6">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-maroon text-white rounded-lg disabled:bg-gray-300"
            >
              Previous
            </button>
            <span className="mx-4 text-lg font-semibold">
              Page {currentPage} of{" "}
              {Math.ceil(filteredPayments.length / itemsPerPage)}
            </span>
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={
                currentPage === Math.ceil(filteredPayments.length / itemsPerPage)
              }
              className="px-4 py-2 bg-maroon text-white rounded-lg disabled:bg-gray-300"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Add/Edit Payment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl">
            <h2 className="text-2xl font-bold text-maroon mb-6">
              {currentPayment ? "Edit Payment" : "Add New Payment"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-gray-700 mb-2">Member</label>
                  <select
                    name="memberId"
                    value={formData.memberId}
                    onChange={handleInputChange}
                    className="w-full p-3 border rounded-lg"
                    required
                  >
                    <option value="">Select Member</option>
                    {members.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.firstName} {member.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Amount (₱)</label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    className="w-full p-3 border rounded-lg"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Payment Date</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="w-full p-3 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Payment Type</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full p-3 border rounded-lg"
                    required
                  >
                    <option value="Annual">Annual</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Walk-in">Walk-in</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Expiry Date</label>
                  <input
                    type="date"
                    name="expiry"
                    value={formData.expiry}
                    onChange={handleInputChange}
                    className="w-full p-3 border rounded-lg"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-maroon text-white rounded-lg hover:bg-maroon-dark transition"
                >
                  {currentPayment ? "Update Payment" : "Add Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className={`flex items-center p-4 rounded-lg shadow-md w-60 ${color}`}>
    <Icon className="text-4xl mr-4 text-maroon" />
    <div>
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  </div>
);

export default Payments;
