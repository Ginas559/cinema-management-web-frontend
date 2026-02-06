import React, { useEffect, useState } from "react";
import { Users, PlusCircle, Pencil, Search, X } from "lucide-react";
import "bootstrap/dist/css/bootstrap.min.css";
import { getEmployees, createEmployee, updateEmployee } from "../services/EmployeeService";
import "../styles/staff.css";

export default function Staff() {
    const emptyForm = {
        employeeId: "",
        fullName: "",
        email: "",
        phoneNumber: "",
        dateOfBirth: "",
        username: "",
    };

    const [employees, setEmployees] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [editing, setEditing] = useState(false);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");

    const load = async (q = "") => {
        try {
            setLoading(true);
            const data = await getEmployees(q);
            setEmployees(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
            setEmployees([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const onChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        try {
            if (editing) {
                const res = await updateEmployee(form.employeeId, form);
                if (res?.success) {
                    setMessage("Updated successfully");
                    await load(search);
                    onReset();
                } else {
                    setMessage(res?.message || "Update failed");
                }
            } else {
                const res = await createEmployee(form);
                if (res?.success) {
                    setMessage("Created successfully");
                    await load(search);
                    onReset();
                } else {
                    setMessage(res?.message || "Create failed");
                }
            }
        } catch (e) {
            console.error(e);
            setMessage("Request failed");
        }
    };

    const onEdit = (emp) => {
        setForm({
            employeeId: emp.employeeId,
            fullName: emp.fullName || "",
            email: emp.email || "",
            phoneNumber: emp.phoneNumber || "",
            dateOfBirth: emp.dateOfBirth || "",
            username: emp.username || "",
        });
        setEditing(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const onReset = () => {
        setForm(emptyForm);
        setEditing(false);
    };

    const onSearch = async (e) => {
        e.preventDefault();
        await load(search);
    };

    return (
        <div className="staff-page">
            <div className="staff-container">
                {/* Header */}
                <header className="staff-header">
                    <div className="staff-title">
                        <Users size={28} className="staff-title-icon" />
                        <div>
                            <h1>Staff Management</h1>
                            <p>Thêm mới, cập nhật và tìm kiếm nhân viên</p>
                        </div>
                    </div>

                    <form className="staff-search" onSubmit={onSearch}>
                        <div className="staff-search-input">
                            <Search size={18} />
                            <input
                                type="text"
                                placeholder="Tìm theo tên, email, số điện thoại..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            {search && (
                                <button
                                    type="button"
                                    className="staff-search-clear"
                                    onClick={() => {
                                        setSearch("");
                                        load("");
                                    }}
                                    aria-label="Clear"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                        <button className="staff-btn staff-btn-outline" type="submit">
                            Tìm
                        </button>
                    </form>
                </header>

                {/* Form card */}
                <section className="staff-card">
                    <div className="staff-card-header">
                        <div className="staff-card-title">
                            <PlusCircle size={20} />
                            <span>{editing ? "Cập nhật nhân viên" : "Thêm nhân viên"}</span>
                        </div>
                        {message && <div className="staff-banner">{message}</div>}
                    </div>

                    <form onSubmit={onSubmit} className="staff-form">
                        <div className="staff-form-grid">
                            <div className="staff-form-group">
                                <label>Họ và tên</label>
                                <input
                                    name="fullName"
                                    value={form.fullName}
                                    onChange={onChange}
                                    placeholder="Nhập tên nhân viên"
                                    required
                                />
                            </div>

                            <div className="staff-form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={form.email}
                                    onChange={onChange}
                                    placeholder="Email"
                                    required
                                />
                            </div>

                            <div className="staff-form-group">
                                <label>Số điện thoại</label>
                                <input
                                    name="phoneNumber"
                                    value={form.phoneNumber}
                                    onChange={onChange}
                                    placeholder="Số điện thoại"
                                    required
                                />
                            </div>

                            <div className="staff-form-group">
                                <label>Ngày sinh</label>
                                <input
                                    type="date"
                                    name="dateOfBirth"
                                    value={form.dateOfBirth}
                                    onChange={onChange}
                                    required
                                />
                            </div>

                            <div className="staff-form-group">
                                <label>Username</label>
                                <input
                                    name="username"
                                    value={form.username}
                                    onChange={onChange}
                                    placeholder="Tên đăng nhập (tạo tài khoản STAFF)"
                                    required
                                    disabled={editing}
                                />
                            </div>

                            <div className="staff-form-group">
                                <label>Mật khẩu mặc định</label>
                                <input value="User@123" disabled />
                                <small>Mật khẩu mặc định cho tài khoản mới là User@123</small>
                            </div>
                        </div>

                        <div className="staff-form-actions">
                            {editing && (
                                <button type="button" onClick={onReset} className="staff-btn staff-btn-secondary">
                                    Hủy
                                </button>
                            )}
                            <button type="submit" className={`staff-btn ${editing ? "staff-btn-warning" : "staff-btn-primary"}`}>
                                {editing ? "Cập nhật" : "Thêm mới"}
                            </button>
                        </div>
                    </form>
                </section>

                {/* Table card */}
                <section className="staff-card staff-table-card">
                    <div className="staff-card-header">
                        <div className="staff-card-title">
                            <Users size={20} />
                            <span>Danh sách nhân viên</span>
                        </div>
                    </div>

                    {loading ? (
                        <div className="staff-loading">Đang tải...</div>
                    ) : (
                        <div className="staff-table-wrap">
                            <table className="staff-table">
                                <thead>
                                    <tr>
                                        <th>Họ tên</th>
                                        <th>Email</th>
                                        <th>SĐT</th>
                                        <th>Ngày sinh</th>
                                        <th>Username</th>
                                        <th className="text-center">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {employees.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="staff-empty">Không có dữ liệu</td>
                                        </tr>
                                    ) : (
                                        employees.map((e) => (
                                            <tr key={e.employeeId}>
                                                <td>{e.fullName}</td>
                                                <td>{e.email}</td>
                                                <td>{e.phoneNumber}</td>
                                                <td>{e.dateOfBirth}</td>
                                                <td>{e.username}</td>
                                                <td className="text-center">
                                                    <button className="staff-btn staff-btn-warning staff-btn-sm" onClick={() => onEdit(e)}>
                                                        <Pencil size={14} />
                                                        Sửa
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
