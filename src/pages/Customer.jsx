import React, { useState } from 'react';
import { useCustomers } from '../hooks/useCustomers';
import { getCustomerBills } from '../services/CustomerService';
import '../styles/customer.css';

export const Customer = () => {
    const {
        customers,
        loading,
        pagination,
        filters,
        handleFilterChange,
        handleSearch,
        handlePageChange,
    } = useCustomers();

    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerBills, setCustomerBills] = useState([]);
    const [billLoading, setBillLoading] = useState(false);
    const [movieFilter, setMovieFilter] = useState('');

    const fetchCustomerBills = async (customerId, movieTitle = '') => {
        setBillLoading(true);
        try {
            const bills = await getCustomerBills(customerId, movieTitle);
            setCustomerBills(bills || []);
        } catch (error) {
            console.error('Error fetching bills:', error);
            setCustomerBills([]);
        } finally {
            setBillLoading(false);
        }
    };

    const handleViewBills = (customer) => {
        setSelectedCustomer(customer);
        setCustomerBills([]);
        setMovieFilter('');
        fetchCustomerBills(customer.customerId);
    };

    return (
        <div className="customer-management">
            <h2 className="customer-title">Customer Management</h2>

            {/* Filters */}
            <div className="customer-filters-section">
                <div className="customer-filter-row">
                    <input
                        type="text"
                        placeholder="Full Name"
                        className="customer-input"
                        value={filters.fullName || ''}
                        onChange={(e) => handleFilterChange('fullName', e.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="Email"
                        className="customer-input"
                        value={filters.email || ''}
                        onChange={(e) => handleFilterChange('email', e.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="Phone Number"
                        className="customer-input"
                        value={filters.phoneNumber || ''}
                        onChange={(e) => handleFilterChange('phoneNumber', e.target.value)}
                    />
                    <select
                        className="customer-select"
                        value={filters.type || ''}
                        onChange={(e) => handleFilterChange('type', e.target.value)}
                    >
                        <option value="">All Types</option>
                        <option value="MEMBER">Member</option>
                        <option value="GUEST">Guest</option>
                    </select>
                    <button onClick={handleSearch} className="customer-search-btn">
                        Search Now
                    </button>
                </div>
                <small className="customer-hint">
                    Search automatically after 0.5s or click "Search Now"
                </small>
            </div>

            {/* Customer Table */}
            <div className="customer-table-container">
                {loading ? (
                    <div className="customer-loading">Loading...</div>
                ) : customers.length === 0 ? (
                    <div className="customer-no-data">No customers found</div>
                ) : (
                    <table className="customer-table">
                        <thead>
                            <tr>
                                <th>Full Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Date of Birth</th>
                                <th>Type</th>
                                <th>Username</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customers.map((customer) => (
                                <tr key={customer.customerId}>
                                    <td>{customer.fullName}</td>
                                    <td>{customer.email}</td>
                                    <td>{customer.phoneNumber}</td>
                                    <td>{customer.dateOfBirth}</td>
                                    <td>
                                        <span className={`customer-type-badge customer-type-${customer.type.toLowerCase()}`}>
                                            {customer.type}
                                        </span>
                                    </td>
                                    <td>{customer.account?.username || 'N/A'}</td>
                                    <td>
                                        <button
                                            onClick={() => handleViewBills(customer)}
                                            className="customer-action-btn customer-view-bills-btn"
                                        >
                                            View Bills
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            <div className="customer-pagination">
                <button
                    className="customer-pagination-btn"
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 0 || loading}
                >
                    Previous
                </button>
                <span className="customer-pagination-info">
                    Page {pagination.currentPage + 1} of {pagination.totalPages || 1} ({pagination.totalElements} total customers)
                </span>
                <button
                    className="customer-pagination-btn"
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage >= pagination.totalPages - 1 || loading}
                >
                    Next
                </button>
            </div>

            {/* Bills Modal */}
            {selectedCustomer && (
                <div className="customer-modal-overlay" onClick={() => setSelectedCustomer(null)}>
                    <div className="customer-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="customer-modal-header">
                            <h3>Bills for {selectedCustomer.fullName}</h3>
                            <button
                                onClick={() => setSelectedCustomer(null)}
                                className="customer-close-btn"
                            >
                                ×
                            </button>
                        </div>
                        <div className="customer-modal-body">
                            {/* Search Filter */}
                            <div className="customer-movie-filter">
                                <input
                                    type="text"
                                    placeholder="Search by movie title..."
                                    className="customer-input"
                                    value={movieFilter}
                                    onChange={(e) => setMovieFilter(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            fetchCustomerBills(selectedCustomer.customerId, movieFilter);
                                        }
                                    }}
                                />
                                <button
                                    onClick={() => fetchCustomerBills(selectedCustomer.customerId, movieFilter)}
                                    className="customer-search-btn"
                                >
                                    Search
                                </button>
                            </div>

                            {/* Bills List */}
                            {billLoading ? (
                                <div className="customer-loading">Loading bills...</div>
                            ) : customerBills.length === 0 ? (
                                <p className="customer-no-bills">No bills found for this customer.</p>
                            ) : (
                                <div className="customer-bills-list">
                                    {customerBills.map((bill) => (
                                        <div key={bill.billId} className="customer-bill-item">
                                            <h4 className="customer-bill-movie-title">{bill.movieTitle}</h4>
                                            <p><strong>Total:</strong> ${bill.totalAmount}</p>
                                            <p><strong>Room:</strong> {bill.roomName}</p>
                                            <p><strong>Seats:</strong> {bill.seats.join(', ')}</p>
                                            <p><strong>Show Time:</strong> {new Date(bill.startTime).toLocaleString()}</p>
                                            <p><strong>Payment:</strong> {bill.paymentMethod}</p>

                                            {bill.orderDetails?.length > 0 && (
                                                <div className="customer-order-details">
                                                    <strong>Services:</strong>
                                                    {bill.orderDetails.map((detail) => (
                                                        <span key={detail.id} className="customer-service-item">
                                                            {detail.serviceName} (x{detail.quantity}) - ${detail.price}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};