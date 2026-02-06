import React, { useState, useEffect } from "react";
import { useEmployees } from "../../../hooks/useEmployees";
import "../../../styles/assign-staff.css";

export function AssignStaff({ isOpen, onClose, shift, onAssign, isLoading }) {
  const { employees, loading, error, handleSearch, fetchEmployees } = useEmployees();
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchEmployees();
      setSelectedEmployee(null);
      setSearchInput("");
    }
  }, [isOpen]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    handleSearch(value);
  };

  const handleEmployeeSelect = (employee) => {
    setSelectedEmployee(employee);
  };

  const handleSubmit = () => {
    if (!selectedEmployee) {
      alert("Please select an employee");
      return;
    }
    onAssign(selectedEmployee.employeeId, shift.shiftId);
  };

  if (!isOpen) return null;

  return (
    <div className="assign-staff-overlay" onClick={onClose}>
      <div className="assign-staff-modal" onClick={(e) => e.stopPropagation()}>
        <div className="assign-staff-header">
          <h2>👥 Assign Employee to Shift</h2>
          <button className="assign-staff-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="assign-staff-shift-info">
          <div className="assign-staff-info-row">
            <span className="assign-staff-info-label">Shift:</span>
            <span className="assign-staff-info-value">{shift?.name}</span>
          </div>
          <div className="assign-staff-info-row">
            <span className="assign-staff-info-label">Date:</span>
            <span className="assign-staff-info-value">{shift?.workDate}</span>
          </div>
          <div className="assign-staff-info-row">
            <span className="assign-staff-info-label">Time:</span>
            <span className="assign-staff-info-value">
              {shift?.startTime} - {shift?.endTime}
            </span>
          </div>
        </div>

        <div className="assign-staff-search">
          <input
            type="text"
            placeholder="🔍 Search by name, email, or phone..."
            value={searchInput}
            onChange={handleSearchChange}
            className="assign-staff-search-input"
          />
        </div>

        <div className="assign-staff-body">
          {loading ? (
            <div className="assign-staff-loading">
              <div className="assign-staff-spinner"></div>
              <p>Loading employees...</p>
            </div>
          ) : error ? (
            <div className="assign-staff-error">
              <p>❌ {error}</p>
            </div>
          ) : employees.length === 0 ? (
            <div className="assign-staff-empty">
              <p>📭 No employees found</p>
            </div>
          ) : (
            <div className="assign-staff-table-container">
              <table className="assign-staff-table">
                <thead>
                  <tr>
                    <th>Select</th>
                    <th>Full Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Position</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee) => (
                    <tr
                      key={employee.employeeId}
                      className={
                        selectedEmployee?.employeeId === employee.employeeId
                          ? "assign-staff-row-selected"
                          : ""
                      }
                      onClick={() => handleEmployeeSelect(employee)}
                    >
                      <td className="assign-staff-select-cell">
                        <input
                          type="radio"
                          name="employee"
                          checked={
                            selectedEmployee?.employeeId === employee.employeeId
                          }
                          onChange={() => handleEmployeeSelect(employee)}
                        />
                      </td>
                      <td className="assign-staff-name">{employee.fullName}</td>
                      <td className="assign-staff-email">{employee.email}</td>
                      <td className="assign-staff-phone">{employee.phoneNumber}</td>
                      <td className="assign-staff-position">
                        <span className="assign-staff-position-badge">
                          {employee.position || "N/A"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {selectedEmployee && (
            <div className="assign-staff-selected-info">
              <p>
                ✓ Selected: <strong>{selectedEmployee.fullName}</strong> (
                {selectedEmployee.email})
              </p>
            </div>
          )}
        </div>

        <div className="assign-staff-actions">
          <button
            className="assign-staff-btn assign-staff-btn-cancel"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            className="assign-staff-btn assign-staff-btn-assign"
            onClick={handleSubmit}
            disabled={!selectedEmployee || isLoading}
          >
            {isLoading ? "Assigning..." : "👥 Assign Employee"}
          </button>
        </div>
      </div>
    </div>
  );
}