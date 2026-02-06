import { useState } from "react";
import { Link } from "react-router-dom";
import {
    Home, Film, User, Users, Calendar, BookOpen, Star, Hash,
    Clapperboard, UserCog, BarChart3, PieChart, ClipboardList,
    Settings, Shield,
    Popcorn
} from "lucide-react";
import cinema from "../assets/cinema.png";
import { LoginForm } from "./modals/authentication/LoginForm";
import { RegisterForm } from "./modals/authentication/RegisterForm";
import { useAuth } from "../hooks/useAuth";
import "../styles/header.css";

const baseMenu = {
    CUSTOMER: [
        { label: "Home", path: "/", icon: Home },
        { label: "Movies - Booking", path: "/mov-bk", icon: Film },
        { label: "My Profile", path: "/prof", icon: User },
        { label: "My Bookings", path: "/bk-his", icon: BookOpen },
        { label: "Reviews", path: "/rev", icon: Star },
        { label: "Support", path: "/sup", icon: Hash },
    ],
    STAFF: [
        { label: "Home", path: "/", icon: Home },
        { label: "POS - Booking", path: "/mov-bk", icon: Clapperboard },
        { label: "Customer", path: "/cus", icon: Users },
        { label: "Transactions", path: "/trans", icon: Calendar },
        { label: "Schedule", path: "/sched", icon: Calendar },
        { label: "Support", path: "/sup", icon: Hash },
    ],
    MANAGER: [
        { label: "Home", path: "/", icon: Home },
        { label: "POS - Booking", path: "/mov-bk", icon: Clapperboard },
        { label: "Customer", path: "/cus", icon: Users },
        { label: "Transactions", path: "/trans", icon: Calendar },
        { label: "Operation", path: "/op", icon: BarChart3 },
        { label: "Services", path: "/serv", icon: Popcorn },
        { label: "Events - Promotions", path: "/ev-prom", icon: PieChart },
        { label: "Staff", path: "/staff", icon: UserCog },
        { label: "Schedule", path: "/sched", icon: Calendar },
        { label: "Reports", path: "/rep", icon: ClipboardList },
        { label: "Support", path: "/sup", icon: Hash },
    ],
    ADMIN: [
        { label: "Home", path: "/", icon: Home },
        { label: "Customer", path: "/cus", icon: Users },
        { label: "Transactions", path: "/trans", icon: Calendar },
        { label: "Operation", path: "/op", icon: BarChart3 },
        { label: "Services", path: "/serv", icon: Popcorn },
        { label: "Events - Promotions", path: "/ev-prom", icon: PieChart },
        { label: "Staff", path: "/staff", icon: UserCog },
        { label: "Schedule", path: "/sched", icon: Calendar },
        { label: "Reports", path: "/rep", icon: ClipboardList },
        { label: "Support", path: "/sup", icon: Hash },
    ],
};

export default function Header() {
    const {
        user,
        logout,
        showLogin,
        openLoginModal,
        closeLoginModal,
    } = useAuth();
    const [showRegister, setShowRegister] = useState(false);

    const menu = user ? baseMenu[user.role] : [];

    const handleSwitchToRegister = () => {
        closeLoginModal();
        setShowRegister(true);
    };

    const handleSwitchToLogin = () => {
        setShowRegister(false);
        openLoginModal();
    };

    const handleCloseModals = () => {
        closeLoginModal();
        setShowRegister(false);
    };

    return (
        <>
            <header className="cinema-header">
                <div className="header-left">
                    <div className="logo">CinemUTE</div>
                    <div className="icon"><img src={cinema} alt="#" /></div>
                </div>

                <div className="header-center">
                    <div className="nav-container">
                        {user && (
                            <nav>
                                <ul className="nav-menu">
                                    {menu.map((item, idx) => (
                                        <li key={idx}>
                                            <Link to={item.path} className="nav-item">
                                                {item.icon && <item.icon className="nav-icon" />}
                                                {item.label}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </nav>
                        )}
                    </div>

                    <div className="header-right">
                        {user ? (
                            <div className="user-info">
                                <span className="user-welcome">
                                    Welcome, {user.username}
                                </span>
                                <button onClick={logout} className="logout-btn">
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <div className="header-auth-buttons">
                                <button
                                    onClick={openLoginModal}
                                    className="header-auth-btn"
                                >
                                    Login
                                </button>
                                <button
                                    onClick={() => setShowRegister(true)}
                                    className="header-auth-btn primary"
                                >
                                    Register
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Login Modal */}
                    {showLogin && (
                        <LoginForm
                            onClose={handleCloseModals}
                            onSwitchToRegister={handleSwitchToRegister}
                            useAuth={useAuth}
                        />
                    )}

                    {/* Register Modal */}
                    {showRegister && (
                        <RegisterForm
                            onClose={handleCloseModals}
                            onSwitchToLogin={handleSwitchToLogin}
                            useAuth={useAuth}
                        />
                    )}
                </div>
            </header>
        </>
    );
}