import { useState, useEffect } from "react";
import { getCustomers, getCustomerBills } from "../services/CustomerService";

export const useCustomers = (initialFilters = {}, initialPageSize = 10) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    size: initialPageSize,
  });
  
  const [filters, setFilters] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    type: '',
    ...initialFilters
  });
  
  const [debouncedFilters, setDebouncedFilters] = useState(filters);

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerBills, setCustomerBills] = useState([]);
  const [billLoading, setBillLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
      setPagination(prev => ({ ...prev, currentPage: 0 }));
    }, 500);

    return () => clearTimeout(timer);
  }, [filters]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.currentPage,
        size: pagination.size,
        ...debouncedFilters,
      };
      const data = await getCustomers(params);
      setCustomers(data.content || []);
      setPagination(prev => ({
        ...prev,
        totalPages: data.totalPages,
        totalElements: data.totalElements,
      }));
    } catch (err) {
      console.error("Error fetching customers:", err);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBills = async (customerId, movieTitle = "") => {
    setBillLoading(true);
    try {
      const bills = await getCustomerBills(customerId, movieTitle);
      setCustomerBills(bills || []);
    } catch (err) {
      console.error("Error fetching bills:", err);
      setCustomerBills([]);
    } finally {
      setBillLoading(false);
    }
  };


  useEffect(() => {
    fetchCustomers();
  }, [pagination.currentPage, pagination.size, debouncedFilters]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleSearch = () => {
    // Force search ngay lập tức
    setDebouncedFilters(filters);
    setPagination(prev => ({ ...prev, currentPage: 0 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
  };

  const handleViewBills = (customer) => {
    setSelectedCustomer(customer);
    setCustomerBills([]);
    fetchBills(customer.customerId);
  };

  return {
    customers,
    loading,
    pagination,
    filters,
    selectedCustomer,
    customerBills,
    billLoading,
    fetchCustomers,
    fetchBills,
    handleFilterChange,
    handleSearch,
    handlePageChange,
    handleViewBills,
    setSelectedCustomer,
    setMovieFilter: (movieTitle) => {
      if (selectedCustomer) fetchBills(selectedCustomer.customerId, movieTitle);
    },
  };
};