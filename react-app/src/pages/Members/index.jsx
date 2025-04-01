import React, { useState, useEffect } from "react";
import { FaMoneyBillWave, FaTrash, FaEdit, FaPlus } from "react-icons/fa";

const Members = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");
  const [filterType, setFilterType] = useState("all");
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMember, setCurrentMember] = useState(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    membershipExpiryDate: "",
    membershipRenewal: "",
    membershipType: "Annual",
    annualMembership: "No",
    notes1: "",
    notes2: "",
    notes3: "",
    length: 1
  });

  // Fetch members from IPC API
  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const response = await window.membersAPI.getMembers();

      if (response && response.success && Array.isArray(response.members)) {
        setMembers(response.members);
      } else {
        throw new Error("Invalid response format from the API");
      }
    } catch (error) {
      setError("Failed to fetch members");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Open modal for adding new member
  const openAddModal = () => {
    setCurrentMember(null);
    setFormData({
      firstName: "",
      lastName: "",
      membershipExpiryDate: "",
      membershipRenewal: "",
      membershipType: "Annual",
      annualMembership: "No",
      notes1: "",
      notes2: "",
      notes3: "",
      length: 1
    });
    setIsModalOpen(true);
  };

  // Open modal for editing member
  const openEditModal = (member) => {
    setCurrentMember(member);
    setFormData({
      firstName: member.firstName,
      lastName: member.lastName,
      membershipExpiryDate: member.membershipExpiryDate,
      membershipRenewal: member.membershipRenewal,
      membershipType: member.membershipType,
      annualMembership: member.annualMembership || "No",
      notes1: member.notes1 || "",
      notes2: member.notes2 || "",
      notes3: member.notes3 || "",
      length: member.length || 1
    });
    setIsModalOpen(true);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentMember) {
        // Update existing member
        await window.membersAPI.updateMember(currentMember.id, formData);
        alert("Member updated successfully!");
      } else {
        // Add new member
        await window.membersAPI.addMember(formData);
        alert("Member added successfully!");
      }
      setIsModalOpen(false);
      fetchMembers(); // Refresh the list
    } catch (error) {
      console.error("Error saving member:", error);
      alert(`Failed to save member: ${error.message}`);
    }
  };

  // Delete a member using IPC API
  const handleDeleteMember = async (memberId) => {
    if (window.confirm("Are you sure you want to delete this member?")) {
      try {
        const response = await window.membersAPI.deleteMember(memberId);
        if (response.success) {
          setMembers((prevMembers) =>
            prevMembers.filter((member) => member.id !== memberId)
          );
          alert("Member deleted successfully!");
        } else {
          throw new Error(response.message || "Failed to delete member");
        }
      } catch (error) {
        console.error("Error deleting member:", error);
        alert("Failed to delete member. Please try again.");
      }
    }
  };

  // Filter and sort members
  const filteredMembers = members
    .filter((member) => {
      const matchesSearchTerm =
        member.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.lastName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType =
        filterType === "all" || member.membershipType.toLowerCase() === filterType.toLowerCase();

      return matchesSearchTerm && matchesType;
    })
    .sort((a, b) =>
      sortOrder === "desc"
        ? new Date(b.createdAt) - new Date(a.createdAt)
        : new Date(a.createdAt) - new Date(b.createdAt)
    );

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentMembers = filteredMembers.slice(indexOfFirstItem, indexOfLastItem);

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
          Members
        </h1>
        <div className="flex justify-between items-center mb-6 p-4 bg-white shadow-lg rounded-lg">
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
              <option value="annual">Annual</option>
              <option value="monthly">Monthly</option>
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
            <FaPlus /> Add Member
          </button>
        </div>

        <div className="bg-white p-8 w-full rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-maroon text-center mb-6">
            Member List
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse rounded-lg shadow-md text-gray-700">
              <thead>
                <tr className="bg-maroon text-white">
                  <th className="px-6 py-4 text-left">Name</th>
                  <th className="px-6 py-4 text-left">Membership Type</th>
                  <th className="px-6 py-4 text-left">Expiry Date</th>
                  <th className="px-6 py-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentMembers.map((member, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-200 hover:bg-gray-100 transition"
                  >
                    <td className="px-6 py-4">{`${member.firstName} ${member.lastName}`}</td>
                    <td className="px-6 py-4">{member.membershipType}</td>
                    <td className="px-6 py-4">
                      {new Date(member.membershipExpiryDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 flex gap-4">
                      <button
                        onClick={() => openEditModal(member)}
                        className="text-blue-600 hover:text-blue-800 transition"
                      >
                        <FaEdit className="text-xl" />
                      </button>
                      <button
                        onClick={() => handleDeleteMember(member.id)}
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
              {Math.ceil(filteredMembers.length / itemsPerPage)}
            </span>
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={
                currentPage === Math.ceil(filteredMembers.length / itemsPerPage)
              }
              className="px-4 py-2 bg-maroon text-white rounded-lg disabled:bg-gray-300"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Add/Edit Member Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl">
            <h2 className="text-2xl font-bold text-maroon mb-6">
              {currentMember ? "Edit Member" : "Add New Member"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 mb-2">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full p-3 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full p-3 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Membership Type</label>
                  <select
                    name="membershipType"
                    value={formData.membershipType}
                    onChange={handleInputChange}
                    className="w-full p-3 border rounded-lg"
                  >
                    <option value="Annual">Annual</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Walk-in">Walk-in</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Annual Membership</label>
                  <select
                    name="annualMembership"
                    value={formData.annualMembership}
                    onChange={handleInputChange}
                    className="w-full p-3 border rounded-lg"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Membership Expiry Date</label>
                  <input
                    type="date"
                    name="membershipExpiryDate"
                    value={formData.membershipExpiryDate}
                    onChange={handleInputChange}
                    className="w-full p-3 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Membership Renewal Date</label>
                  <input
                    type="date"
                    name="membershipRenewal"
                    value={formData.membershipRenewal}
                    onChange={handleInputChange}
                    className="w-full p-3 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Length (months)</label>
                  <input
                    type="number"
                    name="length"
                    value={formData.length}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full p-3 border rounded-lg"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-gray-700 mb-2">Notes 1</label>
                  <textarea
                    name="notes1"
                    value={formData.notes1}
                    onChange={handleInputChange}
                    className="w-full p-3 border rounded-lg"
                    rows="2"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-gray-700 mb-2">Notes 2</label>
                  <textarea
                    name="notes2"
                    value={formData.notes2}
                    onChange={handleInputChange}
                    className="w-full p-3 border rounded-lg"
                    rows="2"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-gray-700 mb-2">Notes 3</label>
                  <textarea
                    name="notes3"
                    value={formData.notes3}
                    onChange={handleInputChange}
                    className="w-full p-3 border rounded-lg"
                    rows="2"
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
                  {currentMember ? "Update Member" : "Add Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Members;
