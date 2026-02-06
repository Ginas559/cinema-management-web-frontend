import React, { useEffect, useState } from 'react';
import { getAllServices } from '../services/UserService';
import styles from '../styles/order-service.css'; 

export default function OrderService({ selectedServices, onUpdateSelectedServices }) {
    const [services, setServices] = useState([]);
    const [filteredServices, setFilteredServices] = useState([]);
    const [searchName, setSearchName] = useState('');
    const [searchPrice, setSearchPrice] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchServices = async () => {
            try {
                const data = await getAllServices();
                setServices(data);
                setFilteredServices(data);
                setLoading(false);
            } catch (err) {
                setError('Failed to load service list.');
                setLoading(false);
            }
        };
        fetchServices();
    }, []);

    useEffect(() => {
        let result = services;
        if (searchName.trim() !== '') {
            result = result.filter(s =>
                s.name.toLowerCase().includes(searchName.toLowerCase())
            );
        }
        if (searchPrice.trim() !== '') {
            const priceValue = parseFloat(searchPrice);
            if (!isNaN(priceValue)) {
                result = result.filter(s => s.price <= priceValue);
            }
        }
        setFilteredServices(result);
    }, [searchName, searchPrice, services]);

    const handleQuantityChange = (service, quantity) => {
        const q = Number(quantity);
        onUpdateSelectedServices(prev => {
            if (q <= 0) {
                return prev.filter(s => s.serviceId !== service.serviceId);
            }
            const exists = prev.find(s => s.serviceId === service.serviceId);
            if (exists) {
                return prev.map(s =>
                    s.serviceId === service.serviceId ? { ...s, quantity: q } : s
                );
            }
            return [...prev, { ...service, quantity: q }];
        });
    };

    const handleRemoveService = (serviceId) => {
        onUpdateSelectedServices(prev => prev.filter(s => s.serviceId !== serviceId));
    };

    const totalPrice = selectedServices.reduce((sum, s) => sum + s.price * s.quantity, 0);

    if (loading) return <p>Loading services...</p>;
    if (error) return <p className="order-service-error">{error}</p>;

    return (
        <div className="order-service-container">
            <div className="order-service-searchBox">
                <input
                    type="text"
                    placeholder="Search by name..."
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    className="order-service-input"
                />
                <input
                    type="number"
                    placeholder="Search by max price..."
                    value={searchPrice}
                    onChange={(e) => setSearchPrice(e.target.value)}
                    className="order-service-input"
                />
            </div>

            <div className="order-service-scrollContainer">
                <div className="order-service-grid">
                    {filteredServices.length === 0 ? (
                        <p>No matching services found.</p>
                    ) : (
                        filteredServices.map((service, index) => (
                            <div key={index} className="order-service-card">
                                <div className="order-service-cardHeader">
                                    <h4 className="order-service-serviceName">{service.name}</h4>
                                    <div className="order-service-qtyBox">
                                        <label className="order-service-qtyLabel">Qty:</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={
                                                selectedServices.find(s => s.serviceId === service.serviceId)?.quantity || 0
                                            }
                                            onChange={(e) => handleQuantityChange(service, e.target.value)}
                                            className="order-service-qtyInput"
                                        />
                                    </div>
                                </div>
                                <p className="order-service-desc">{service.description}</p>
                                <p><strong>Price:</strong> {service.price.toLocaleString()}$</p>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="order-service-preview">
                <h3>Selected Services</h3>
                {selectedServices.length === 0 ? (
                    <p>No services selected yet.</p>
                ) : (
                    <ul className="order-service-previewList">
                        {selectedServices.map((s, i) => (
                            <li key={i} className="order-service-previewItem">
                                <span>{s.name} × {s.quantity} — {(s.price * s.quantity).toLocaleString()}$</span>
                                <button
                                    onClick={() => handleRemoveService(s.serviceId)}
                                    className="order-service-removeBtn"
                                >Remove</button>
                            </li>
                        ))}
                    </ul>
                )}
                <h3 className="order-service-total">Total: {totalPrice.toLocaleString()}$</h3>
                
                <p className="order-service-hint">💡 Click "Next" to confirm your services</p>
            </div>
        </div>
    );
}