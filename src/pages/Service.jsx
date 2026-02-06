import React, { useState, useEffect } from "react";
import { getAllServices, createService, updateService } from "../services/ServiceService";
import "../styles/service-admin.css";

export default function ServiceAdmin() {
  const [services, setServices] = useState([]);
  const [form, setForm] = useState({ serviceId: "", name: "", price: "", description: "" });
  const [editing, setEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const data = await getAllServices();
        setServices(data);
      } catch (err) {
        console.error("Error fetching services:", err);
      }
    };
    fetchServices();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = editing
        ? await updateService(form.serviceId, form)
        : await createService(form);

      setServices((prev) =>
        editing ? prev.map((s) => (s.serviceId === data.serviceId ? data : s)) : [...prev, data]
      );
      resetForm();
    } catch (error) {
      alert("Failed to " + (editing ? "update" : "create") + " service!");
      console.error(error);
    }
  };

  const resetForm = () => {
    setForm({ serviceId: "", name: "", price: "", description: "" });
    setEditing(false);
  };

  const handleEdit = (service) => {
    setForm(service);
    setEditing(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filteredServices = services.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container py-5">
      <div className="card shadow-sm">
        <div className="card-header bg-primary text-white text-center">
          <h3 className="mb-0">Quản lý dịch vụ</h3>
        </div>
        <div className="card-body">
          {/* ✅ Form thêm/sửa */}
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Tên dịch vụ</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Nhập tên dịch vụ"
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">Giá $</label>
                <input
                  name="price"
                  type="number"
                  value={form.price}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Nhập giá"
                  required
                />
              </div>

              <div className="col-12">
                <label className="form-label">Mô tả</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  className="form-control"
                  rows="2"
                  placeholder="Nhập mô tả dịch vụ"
                ></textarea>
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2 mt-3">
              {editing && (
                <button type="button" onClick={resetForm} className="btn btn-secondary">
                  Hủy
                </button>
              )}
              <button type="submit" className={`btn ${editing ? "btn-warning" : "btn-primary"}`}>
                {editing ? "Cập nhật" : "Thêm mới"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ✅ Danh sách dịch vụ */}
      <div className="card shadow-sm mt-4">
        <div className="card-header bg-light d-flex justify-content-between align-items-center">
          <h5 className="mb-0">services</h5>
          <input
            type="text"
            className="form-control w-25"
            placeholder="Tìm kiếm dịch vụ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="card-body p-0">
          <div className="table-responsive service-table">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-primary sticky-top">
                <tr>
                  <th>Name</th>
                  <th>Price</th>
                  <th>Description</th>
                  <th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredServices.length > 0 ? (
                  filteredServices.map((s) => (
                    <tr key={s.serviceId}>
                      <td>{s.name}</td>
                      <td>{s.price.toLocaleString()} $</td>
                      <td>{s.description}</td>
                      <td className="text-center">
                        <button className="btn btn-sm btn-warning" onClick={() => handleEdit(s)}>
                          Sửa
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center text-muted py-3">
                      There's no services to show
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
