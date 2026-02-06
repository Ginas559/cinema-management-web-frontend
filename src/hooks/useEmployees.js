import { useState, useEffect } from "react";
import { getEmployees } from "../services/EmployeeService";

export function useEmployees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchEmployees = async (search = "") => {
    setLoading(true);
    setError(null);
    try {
      const data = await getEmployees(search);
      setEmployees(data);
    } catch (err) {
      setError(err.message || "Failed to fetch employees");
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees(searchQuery);
  }, [searchQuery]);

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const refreshEmployees = () => {
    fetchEmployees(searchQuery);
  };

  return {
    employees,
    loading,
    error,
    searchQuery,
    handleSearch,
    refreshEmployees,
    fetchEmployees,
  };
}